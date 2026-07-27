import React, {useState, useRef, useEffect} from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  View, Modal, KeyboardAvoidingView, Platform,
  TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import {Text, Button, TextInput, Snackbar, Icon, IconButton, Divider, useTheme, TouchableRipple} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useBankStore} from '../../store/bankStore';
import {useSettingsStore} from '../../store/settingsStore';
import {BRAND_GRADIENT, cardShadow} from '../../theme';
import {
  getTitle, getAvatarLevel, getLeaderboard, MILESTONE_MESSAGES,
  getBoss, getCommunityGoal, getWeekStart, TITLES, getUnlockedTitles,
} from '../../utils/engagement';
import MonthlyCalendar from '../../components/MonthlyCalendar';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;
type Sheet = 'closed' | 'intro' | 'mode' | 'manual' | 'titles';

const REP_TITLES = [...TITLES]
  .reverse()
  .filter(t => /^[\d,]+ reps$/.test(t.unlock))
  .map(t => ({...t, repCount: parseInt(t.unlock.replace(/[^\d]/g, ''), 10)}));

function GhostCard({yesterdayHourlyReps, todayReps}: {yesterdayHourlyReps: number[]; todayReps: number}) {
  const theme = useTheme();
  const c = theme.colors;
  const hour = new Date().getHours();
  const ghostReps = Math.max(0, ...yesterdayHourlyReps.slice(0, hour + 1));

  if (ghostReps === 0) {
    return (
      <View style={[{backgroundColor: c.surface, borderRadius: 20, padding: 20}, theme.dark ? {} : cardShadow]}>
        <Text style={{fontSize: 13, fontWeight: '700', color: c.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8}}>
          👻 Ghost Mode
        </Text>
        <Text style={{fontSize: 14, color: c.onSurfaceVariant, lineHeight: 20}}>
          Ghost mode activates tomorrow — race your past self
        </Text>
      </View>
    );
  }

  const delta = todayReps - ghostReps;
  const ahead = delta >= 0;

  return (
    <View style={[{backgroundColor: c.surface, borderRadius: 20, padding: 20}, theme.dark ? {} : cardShadow]}>
      <Text style={{fontSize: 13, fontWeight: '700', color: c.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14}}>
        👻 vs. Yesterday-You
      </Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <View style={{alignItems: 'center', gap: 3}}>
          <Text style={{fontSize: 11, color: c.onSurfaceVariant, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4}}>Yesterday</Text>
          <Text style={{fontSize: 34, fontWeight: '800', color: c.onSurfaceVariant, letterSpacing: -1}}>{ghostReps}</Text>
          <Text style={{fontSize: 11, color: c.onSurfaceVariant}}>by now</Text>
        </View>
        <View style={{alignItems: 'center', gap: 2}}>
          <Text style={{fontSize: 26, fontWeight: '800', color: ahead ? c.primary : c.error}}>
            {ahead ? '▲' : '▼'} {Math.abs(delta)}
          </Text>
          <Text style={{fontSize: 11, fontWeight: '700', color: ahead ? c.primary : c.error, letterSpacing: 0.5}}>
            {ahead ? 'AHEAD' : 'BEHIND'}
          </Text>
        </View>
        <View style={{alignItems: 'center', gap: 3}}>
          <Text style={{fontSize: 11, color: c.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4}}>Today</Text>
          <Text style={{fontSize: 34, fontWeight: '800', color: c.primary, letterSpacing: -1}}>{todayReps}</Text>
          <Text style={{fontSize: 11, color: c.onSurfaceVariant}}>so far</Text>
        </View>
      </View>
    </View>
  );
}

const RANK_MEDALS = ['🥇', '🥈', '🥉', '', ''];

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({value, label}: {value: string; label: string}) {
  const theme = useTheme();
  return (
    <View style={[{
      flex: 1, backgroundColor: theme.colors.surface,
      borderRadius: 20, padding: 20, alignItems: 'center',
    }, theme.dark ? {} : cardShadow]}>
      <Text style={{
        fontSize: 38, fontWeight: '800',
        color: theme.colors.primary, letterSpacing: -1, lineHeight: 44,
      }}>
        {value}
      </Text>
      <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: '500'}}>
        {label}
      </Text>
    </View>
  );
}

function AvatarCard({totalReps, streak, freezeCount, equippedTitle, userName, onPress}: {
  totalReps: number; streak: number; freezeCount: number;
  equippedTitle: string | null; userName: string; onPress: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const avatar = getAvatarLevel(totalReps);
  const displayTitle = equippedTitle ?? getTitle(totalReps, streak);

  const next = [20, 50, 100, 200, 400, 750, 1500, 3000, 6000].find(t => totalReps < t) ?? null;
  const prevThreshold = avatar.minReps;
  const progress = next
    ? Math.min((totalReps - prevThreshold) / (next - prevThreshold), 1)
    : 1;

  const nextRepTitle = React.useMemo(
    () => REP_TITLES.find(t => t.repCount > totalReps),
    [totalReps],
  );
  const nextTitleRepsNeeded = nextRepTitle ? nextRepTitle.repCount - totalReps : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[{
        backgroundColor: c.surface, borderRadius: 20, padding: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
      }, theme.dark ? {} : cardShadow]}>
      <View style={{
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: c.primaryContainer,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{fontSize: 36}}>{avatar.emoji}</Text>
        <View style={{
          position: 'absolute', bottom: -6, right: -6,
          backgroundColor: c.primary, borderRadius: 10,
          paddingHorizontal: 6, paddingVertical: 2,
        }}>
          <Text style={{fontSize: 10, fontWeight: '800', color: '#fff'}}>Lv.{avatar.level}</Text>
        </View>
      </View>

      <View style={{flex: 1}}>
        {/* Name row */}
        <Text style={{fontSize: 18, fontWeight: '800', color: c.onSurface, letterSpacing: -0.3}}>
          {userName || 'Riser'}
        </Text>
        {/* Title row with tap hint */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2}}>
          <Text style={{fontSize: 12, color: c.onSurfaceVariant, fontWeight: '500'}}>
            {displayTitle}
          </Text>
          <Icon source="pencil-outline" size={13} color={c.onSurfaceVariant} />
        </View>

        {/* Level progress bar */}
        <View style={{marginTop: 10}}>
          <View style={{height: 6, backgroundColor: c.surfaceVariant, borderRadius: 100, overflow: 'hidden'}}>
            <LinearGradient
              colors={BRAND_GRADIENT.colors}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{height: 6, borderRadius: 100, width: `${Math.max(progress * 100, 4)}%`}}
            />
          </View>
          {nextRepTitle && (
            <Text style={{fontSize: 10, color: c.onSurfaceVariant, marginTop: 4}}>
              🏷️ {nextTitleRepsNeeded.toLocaleString()} reps until {nextRepTitle.label}
            </Text>
          )}
        </View>

        {/* Freeze shields */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8}}>
          <Text style={{fontSize: 11}}>❄️</Text>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: i < freezeCount ? '#4FC3F7' : c.surfaceVariant,
              }}
            />
          ))}
          <Text style={{fontSize: 10, color: c.onSurfaceVariant, marginLeft: 2}}>
            {freezeCount > 0 ? `${freezeCount}/3 freeze${freezeCount > 1 ? 's' : ''}` : 'earn at day 7'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LeaderboardCard({weekReps}: {weekReps: number}) {
  const theme = useTheme();
  const c = theme.colors;
  const entries = React.useMemo(() => getLeaderboard(weekReps), [weekReps]);

  return (
    <View style={[{
      backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden',
    }, theme.dark ? {} : cardShadow]}>
      <View style={{paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Weekly Leaderboard</Text>
        <Text style={{fontSize: 11, color: c.onSurfaceVariant, fontWeight: '500'}}>This week</Text>
      </View>

      {entries.map((entry, i) => {
        const isUser = entry.isUser;
        return (
          <View key={i}>
            {i > 0 && <View style={{height: 1, backgroundColor: c.outline, marginLeft: isUser ? 0 : 20}} />}
            <LinearGradient
              colors={isUser ? ['rgba(255,107,0,0.12)', 'rgba(255,45,0,0.06)'] : ['transparent', 'transparent']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, paddingVertical: 13, gap: 12,
              }}>
              <Text style={{fontSize: 16, width: 28, textAlign: 'center'}}>
                {RANK_MEDALS[entry.rank - 1] || `${entry.rank}`}
              </Text>
              <Text style={{
                flex: 1, fontSize: 15,
                fontWeight: isUser ? '800' : '500',
                color: isUser ? c.primary : c.onSurface,
              }}>
                {entry.name}
              </Text>
              <Text style={{
                fontSize: 15, fontWeight: '700',
                color: isUser ? c.primary : c.onSurfaceVariant,
              }}>
                {entry.weekReps.toLocaleString()}
              </Text>
              <Text style={{fontSize: 12, color: c.onSurfaceVariant, width: 30}}>reps</Text>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
}

function ShareCardModal({visible, onClose, totalReps, streak, weekReps}: {
  visible: boolean; onClose: () => void;
  totalReps: number; streak: number; weekReps: number;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const avatar = getAvatarLevel(totalReps);
  const title = getTitle(totalReps, streak);
  const today = new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24}}>

        {/* The card — screenshot this */}
        <LinearGradient
          colors={['#1A1A1A', '#0A0A0A']}
          style={{width: '100%', borderRadius: 28, padding: 28, gap: 20}}>
          {/* Header */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <LinearGradient
                colors={BRAND_GRADIENT.colors}
                start={BRAND_GRADIENT.start} end={BRAND_GRADIENT.end}
                style={{width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 18}}>⏰</Text>
              </LinearGradient>
              <Text style={{fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3}}>PushRise</Text>
            </View>
            <Text style={{fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500'}}>{today}</Text>
          </View>

          {/* Avatar + Title */}
          <View style={{alignItems: 'center', gap: 8, paddingVertical: 8}}>
            <View style={{
              width: 80, height: 80, borderRadius: 22,
              backgroundColor: 'rgba(255,85,0,0.15)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: 'rgba(255,85,0,0.3)',
            }}>
              <Text style={{fontSize: 42}}>{avatar.emoji}</Text>
            </View>
            <LinearGradient
              colors={BRAND_GRADIENT.colors}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={{borderRadius: 100, paddingHorizontal: 16, paddingVertical: 5}}>
              <Text style={{fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.3}}>
                {title.toUpperCase()}
              </Text>
            </LinearGradient>
          </View>

          {/* Big stat */}
          <View style={{alignItems: 'center'}}>
            <Text style={{
              fontSize: 72, fontWeight: '800', color: '#FFFFFF',
              letterSpacing: -3, lineHeight: 76,
            }}>
              {weekReps}
            </Text>
            <Text style={{fontSize: 16, color: 'rgba(255,255,255,0.55)', fontWeight: '500'}}>
              push-ups this week
            </Text>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: 'rgba(255,255,255,0.08)'}} />

          {/* Footer stats */}
          <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
            <View style={{alignItems: 'center', gap: 3}}>
              <Text style={{fontSize: 22, fontWeight: '800', color: '#FF7040'}}>{totalReps.toLocaleString()}</Text>
              <Text style={{fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500'}}>ALL TIME</Text>
            </View>
            <View style={{width: 1, backgroundColor: 'rgba(255,255,255,0.08)'}} />
            <View style={{alignItems: 'center', gap: 3}}>
              <Text style={{fontSize: 22, fontWeight: '800', color: streak > 0 ? '#FF7040' : 'rgba(255,255,255,0.3)'}}>
                {streak > 0 ? `🔥 ${streak}` : '—'}
              </Text>
              <Text style={{fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500'}}>DAY STREAK</Text>
            </View>
          </View>

          <Text style={{textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.2}}>
            Think you can keep up? 👊
          </Text>
          <Text style={{textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, fontWeight: '500'}}>
            PUSHRISE - ANDROID
          </Text>
        </LinearGradient>

        {/* Instruction — outside the card so it's not in the screenshot */}
        <Text style={{color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 20, fontWeight: '500', letterSpacing: 0.3}}>
          ✦  Screenshot the card above to share  ✦
        </Text>

        <TouchableOpacity onPress={onClose} style={{marginTop: 16, padding: 12}}>
          <Text style={{color: 'rgba(255,255,255,0.6)', fontSize: 15}}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function CelebrationModal({visible, bonus, milestone, onClose}: {
  visible: boolean; bonus: number; milestone: number | null; onClose: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const msg = milestone ? MILESTONE_MESSAGES[milestone] : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32}}>
        <View style={[{
          backgroundColor: c.surface, borderRadius: 28,
          padding: 32, alignItems: 'center', width: '100%',
        }, theme.dark ? {} : cardShadow]}>

          {/* Milestone message */}
          {msg && (
            <>
              <Text style={{fontSize: 48, marginBottom: 16}}>🏆</Text>
              <Text style={{
                fontSize: 22, fontWeight: '800', color: c.onSurface,
                textAlign: 'center', letterSpacing: -0.5, marginBottom: 10,
              }}>
                {msg.title}
              </Text>
              <Text style={{
                fontSize: 15, color: c.onSurfaceVariant, textAlign: 'center',
                lineHeight: 24, marginBottom: 24,
              }}>
                {msg.body}
              </Text>
            </>
          )}

          {/* Bonus reps */}
          {bonus > 0 && (
            <View style={{alignItems: 'center', marginBottom: msg ? 16 : 24}}>
              {!msg && <Text style={{fontSize: 48, marginBottom: 12}}>🎲</Text>}
              <LinearGradient
                colors={BRAND_GRADIENT.colors}
                start={BRAND_GRADIENT.start} end={BRAND_GRADIENT.end}
                style={{borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 8}}>
                <Text style={{fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3}}>
                  +{bonus} Lucky Rep{bonus > 1 ? 's' : ''}! 🎉
                </Text>
              </LinearGradient>
              {!msg && (
                <Text style={{fontSize: 14, color: c.onSurfaceVariant, textAlign: 'center'}}>
                  Bonus reps added to your bank.
                </Text>
              )}
            </View>
          )}

          <Button mode="contained" onPress={onClose} contentStyle={{paddingHorizontal: 24, paddingVertical: 6}}>
            Let's go 💪
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function FreezeEarnedModal({visible, freezeCount, onClose}: {
  visible: boolean; freezeCount: number; onClose: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32}}>
        <View style={[{backgroundColor: c.surface, borderRadius: 28, padding: 32, alignItems: 'center', width: '100%'}, theme.dark ? {} : cardShadow]}>
          <Text style={{fontSize: 52, marginBottom: 12}}>🧊</Text>
          <Text style={{
            fontSize: 22, fontWeight: '800', color: c.onSurface,
            textAlign: 'center', letterSpacing: -0.5, marginBottom: 8,
          }}>
            Freeze Earned!
          </Text>
          <Text style={{fontSize: 14, color: c.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 20}}>
            7-day streak. A freeze shield has been added to your bank — it'll save your streak if you miss a day.
          </Text>
          {/* Shield dots */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28}}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: i < freezeCount ? '#4FC3F7' : c.surfaceVariant,
              }} />
            ))}
            <Text style={{fontSize: 12, color: c.onSurfaceVariant}}>{freezeCount}/3 banked</Text>
          </View>
          <Button mode="contained" onPress={onClose} contentStyle={{paddingHorizontal: 32, paddingVertical: 6}}>
            Let's go 💪
          </Button>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const c = theme.colors;

  const {
    totalReps, todayReps, weekReps, currentStreak, longestStreak,
    hasSeenBankIntro, markIntroSeen, addReps,
    pendingCelebration, clearCelebration,
    pendingFreezeEarned, clearFreezeEarned,
    pendingFreezeUsed, clearFreezeUsed,
    freezeCount, equippedTitle, setEquippedTitle,
    bossDefeatedWeek, defeatBoss,
    yesterdayHourlyReps, dailyHistory,
  } = useBankStore();
  const {dailyGoal, grindingFor, userName} = useSettingsStore();
  const insets = useSafeAreaInsets();

  const [sheet, setSheet] = useState<Sheet>('closed');
  const [manualInput, setManualInput] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFreezeEarned, setShowFreezeEarned] = useState(false);
  const [showFreezeUsedSnack, setShowFreezeUsedSnack] = useState(false);
  const [communityGoal, setCommunityGoal] = useState(getCommunityGoal);
  const [showBossWin, setShowBossWin] = useState(false);

  const weekStart = useBankStore(s => s.weekStartDate) || getWeekStart();
  const boss = React.useMemo(
    () => getBoss(weekReps, weekStart, bossDefeatedWeek),
    [weekReps, weekStart, bossDefeatedWeek],
  );

  // Refresh community goal number every 30s for live feel
  React.useEffect(() => {
    const t = setInterval(() => setCommunityGoal(getCommunityGoal()), 30000);
    return () => clearInterval(t);
  }, []);

  // Check if user beat the boss
  React.useEffect(() => {
    if (!boss.isDefeated && weekReps > boss.weekReps && weekReps > 0) {
      defeatBoss(weekStart);
      setShowBossWin(true);
    }
  }, [weekReps, boss.weekReps, boss.isDefeated, weekStart, defeatBoss]);

  // Pick up any pending celebration (from camera screen or alarm firing)
  useFocusEffect(
    React.useCallback(() => {
      if (pendingCelebration) setShowCelebration(true);
      if (pendingFreezeEarned) setShowFreezeEarned(true);
      if (pendingFreezeUsed) setShowFreezeUsedSnack(true);
    }, [pendingCelebration, pendingFreezeEarned, pendingFreezeUsed]),
  );

  const dismissCelebration = () => {
    setShowCelebration(false);
    clearCelebration();
  };

  const openBank = () => setSheet(hasSeenBankIntro ? 'mode' : 'intro');
  const handleIntroNext = () => { markIntroSeen(); setSheet('mode'); };

  const handleCamera = () => {
    closeSheet();
    setTimeout(() => navigation.navigate('BankCamera'), 350);
  };

  const submitManual = () => {
    const n = parseInt(manualInput, 10);
    if (n > 0) addReps(n);
    setManualInput('');
    closeSheet();
  };

  const goalProgress = dailyGoal > 0 ? Math.min(todayReps / dailyGoal, 1) : 0;

  // Fire confetti once per session when daily goal is first crossed
  const confettiRef = useRef<any>(null);
  const goalFiredRef = useRef(false);
  useEffect(() => {
    if (dailyGoal > 0 && todayReps >= dailyGoal && !goalFiredRef.current) {
      goalFiredRef.current = true;
      confettiRef.current?.start();
    }
  }, [todayReps, dailyGoal]);

  // #11 — spring-animate the daily goal progress bar width
  const barAnim = useRef(new Animated.Value(0)).current;
  const barHalfWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(barAnim, {toValue: goalProgress, useNativeDriver: true, tension: 45, friction: 9}).start();
  }, [goalProgress]);

  // #16 — spring overshoot for bank sheet entrance
  const sheetY = useRef(new Animated.Value(500)).current;
  const prevSheet = useRef<Sheet>('closed');
  useEffect(() => {
    if (prevSheet.current === 'closed' && sheet !== 'closed') {
      sheetY.setValue(500);
      Animated.spring(sheetY, {toValue: 0, useNativeDriver: true, tension: 55, friction: 8}).start();
    }
    prevSheet.current = sheet;
  }, [sheet]);
  const unlockedTitleSet = React.useMemo(
    () => new Set(getUnlockedTitles(totalReps, currentStreak).map(t => t.label)),
    [totalReps, currentStreak],
  );

  const closeSheet = () => {
    Animated.spring(sheetY, {toValue: 600, useNativeDriver: true, tension: 80, friction: 12}).start(
      () => setSheet('closed'),
    );
  };

  const sheetBg = {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 48,
  };

  const handle = (
    <View style={{width: 40, height: 4, backgroundColor: c.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 24}} />
  );

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <Text style={{fontSize: 34, fontWeight: '800', color: c.onBackground, letterSpacing: -0.5}}>
          Progress
        </Text>
        <TouchableOpacity
          onPress={() => setShowShare(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: c.surfaceVariant, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
          }}>
          <Text style={{fontSize: 13}}>🔗</Text>
          <Text style={{fontSize: 13, fontWeight: '700', color: c.onBackground}}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{paddingHorizontal: 16, gap: 12, paddingBottom: 120}}
        showsVerticalScrollIndicator={false}>

        {currentStreak > 0 && todayReps === 0 && new Date().getHours() >= 20 && (
          <View style={{
            backgroundColor: theme.dark ? 'rgba(255,193,7,0.15)' : 'rgba(255,193,7,0.2)',
            borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: 'rgba(255,180,0,0.35)',
          }}>
            <Text style={{fontSize: 14, fontWeight: '600', color: theme.dark ? '#FFD54F' : '#7B5800', lineHeight: 20}}>
              ⚠️ Log reps before midnight to keep your {currentStreak}-day streak.
            </Text>
          </View>
        )}

        {/* Avatar + title */}
        <AvatarCard
          totalReps={totalReps}
          streak={currentStreak}
          freezeCount={freezeCount}
          equippedTitle={equippedTitle}
          userName={userName}
          onPress={() => setSheet('titles')}
        />

        {/* Bank Push-ups hero */}
        <TouchableRipple onPress={openBank} borderless style={{borderRadius: 24}}>
          <LinearGradient
            colors={BRAND_GRADIENT.colors}
            start={BRAND_GRADIENT.start} end={BRAND_GRADIENT.end}
            style={{
              borderRadius: 24, padding: 22,
              flexDirection: 'row', alignItems: 'center', gap: 16,
              shadowColor: '#FF4500', shadowOffset: {width: 0, height: 8},
              shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
            }}>
            <Text style={{fontSize: 36}}>💪🏽</Text>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3}}>
                Bank Push-ups
              </Text>
              <Text style={{fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3}}>
                Add reps to your reward bank
              </Text>
            </View>
            <Text style={{fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: '300'}}>›</Text>
          </LinearGradient>
        </TouchableRipple>

        {/* Stat cards */}
        <View style={{flexDirection: 'row', gap: 12}}>
          <StatCard value={totalReps.toLocaleString()} label="banked reps" />
          <StatCard
            value={currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}
            label="day streak"
          />
        </View>

        {longestStreak > 0 && (
          <Text style={{fontSize: 12, color: c.onSurfaceVariant, textAlign: 'center', fontWeight: '500'}}>
            Best streak: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Daily goal */}
        {dailyGoal > 0 && (
          <View style={[{backgroundColor: c.surface, borderRadius: 20, padding: 20}, theme.dark ? {} : cardShadow]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14}}>
              <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Today's Goal</Text>
              <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4}}>
                <Text style={{fontSize: 22, fontWeight: '800', color: c.primary}}>{todayReps}</Text>
                <Text style={{fontSize: 14, color: c.onSurfaceVariant, fontWeight: '500'}}>/ {dailyGoal}</Text>
              </View>
            </View>
            <View
              style={{height: 8, backgroundColor: c.surfaceVariant, borderRadius: 100, overflow: 'hidden'}}
              onLayout={e => barHalfWidth.setValue(e.nativeEvent.layout.width / 2)}
            >
              <Animated.View style={{
                height: 8, width: '100%',
                transform: [
                  {translateX: Animated.subtract(Animated.multiply(barAnim, barHalfWidth), barHalfWidth)},
                  {scaleX: barAnim},
                ],
              }}>
                <LinearGradient
                  colors={BRAND_GRADIENT.colors}
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                  style={{flex: 1}}
                />
              </Animated.View>
            </View>
            {todayReps >= dailyGoal && (
              <Text style={{fontSize: 13, color: c.primary, marginTop: 10, fontWeight: '700'}}>
                🎉 Goal crushed!
              </Text>
            )}
          </View>
        )}

        {/* Grinding for — commitment contract */}
        {grindingFor ? (
          <View style={[{
            backgroundColor: c.surface, borderRadius: 20, padding: 18,
            flexDirection: 'row', alignItems: 'flex-start', gap: 12,
          }, theme.dark ? {} : cardShadow]}>
            <Text style={{fontSize: 20, marginTop: 1}}>🎯</Text>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 11, fontWeight: '700', color: c.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4}}>
                Grinding For
              </Text>
              <Text style={{fontSize: 15, color: c.onSurface, fontStyle: 'italic', lineHeight: 22}}>
                "{grindingFor}"
              </Text>
            </View>
          </View>
        ) : null}

        {/* Community challenge */}
        <View style={[{backgroundColor: c.surface, borderRadius: 20, padding: 20}, theme.dark ? {} : cardShadow]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14}}>
            <View style={{width: 7, height: 7, borderRadius: 4, backgroundColor: c.primary}} />
            <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Community Challenge</Text>
            <Text style={{fontSize: 11, color: c.onSurfaceVariant, marginLeft: 'auto', fontWeight: '500'}}>This week</Text>
          </View>
          <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 12, lineHeight: 20}}>
            The PushRise community is{' '}
            <Text style={{fontWeight: '800', color: c.primary}}>
              {communityGoal.repsToGo.toLocaleString()}
            </Text>
            {' '}push-ups away from{' '}
            <Text style={{fontWeight: '700', color: c.onSurface}}>{communityGoal.goal.toLocaleString()}</Text>
            {' '}this week.
          </Text>
          <View style={{height: 8, backgroundColor: c.surfaceVariant, borderRadius: 100, overflow: 'hidden'}}>
            <LinearGradient
              colors={BRAND_GRADIENT.colors}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={{height: 8, borderRadius: 100, width: `${(communityGoal.total / communityGoal.goal) * 100}%`}}
            />
          </View>
          <Text style={{fontSize: 11, color: c.onSurfaceVariant, marginTop: 8, fontWeight: '500', textAlign: 'right'}}>
            {communityGoal.total.toLocaleString()} / {communityGoal.goal.toLocaleString()}
          </Text>
        </View>

        {/* Boss battle */}
        <View style={[{backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden'}, theme.dark ? {} : cardShadow]}>
          {boss.isDefeated ? (
            <LinearGradient
              colors={['rgba(255,107,0,0.12)', 'rgba(255,45,0,0.04)']}
              style={{padding: 20}}>
              <Text style={{fontSize: 13, fontWeight: '700', color: c.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8}}>
                ⚔️ Rival This Week
              </Text>
              <Text style={{fontSize: 22, fontWeight: '800', color: c.onSurface, letterSpacing: -0.3, marginBottom: 4}}>
                🏆 You beat {boss.name}!
              </Text>
              <Text style={{fontSize: 13, color: c.onSurfaceVariant}}>
                {boss.weekReps} reps vs your {weekReps}. New rival starts next week.
              </Text>
            </LinearGradient>
          ) : (
            <View style={{padding: 20}}>
              <Text style={{fontSize: 13, fontWeight: '700', color: c.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8}}>
                ⚔️ Rival This Week
              </Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12}}>
                <View>
                  <Text style={{fontSize: 22, fontWeight: '800', color: c.onSurface, letterSpacing: -0.3}}>
                    {boss.name}
                  </Text>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 2}}>
                    {boss.weekReps} reps this week
                  </Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={{fontSize: 22, fontWeight: '800', color: c.primary, letterSpacing: -0.3}}>
                    You
                  </Text>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 2}}>
                    {weekReps} reps
                  </Text>
                </View>
              </View>
              <View style={{backgroundColor: c.surfaceVariant, borderRadius: 10, padding: 10}}>
                <Text style={{fontSize: 13, fontWeight: '700', color: c.primary, textAlign: 'center'}}>
                  {boss.weekReps > weekReps
                    ? `You're ${(boss.weekReps - weekReps).toLocaleString()} reps behind — catch up.`
                    : `You're ahead by ${(weekReps - boss.weekReps).toLocaleString()} reps — don't stop.`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Ghost mode */}
        <GhostCard yesterdayHourlyReps={yesterdayHourlyReps} todayReps={todayReps} />

        {/* Leaderboard */}
        <LeaderboardCard weekReps={weekReps} />

        <MonthlyCalendar dailyHistory={dailyHistory ?? {}} />

      </ScrollView>

      {/* Bank sheet — #16 spring overshoot entrance */}
      <Modal
        visible={sheet !== 'closed'}
        transparent animationType="fade"
        onRequestClose={closeSheet}>
        <KeyboardAvoidingView behavior="padding" enabled={sheet === 'manual'} style={{flex: 1, justifyContent: 'flex-end', backgroundColor: c.backdrop}}>
        <Animated.View style={{transform: [{translateY: sheetY}]}}>

          {sheet === 'intro' && (
            <View style={sheetBg}>
              {handle}
              <Text style={{fontSize: 26, fontWeight: '800', color: c.onSurface, letterSpacing: -0.5, marginBottom: 14}}>
                Earn while you grind.
              </Text>
              <Text style={{fontSize: 16, color: c.onSurfaceVariant, lineHeight: 26, marginBottom: 32}}>
                Every push-up you do adds to your bank. Cash it in for anything you want — TV time, money, a new fit. You set the rewards. You set the price.
              </Text>
              <Button mode="contained" onPress={handleIntroNext} contentStyle={{paddingVertical: 8}}>
                Let's go
              </Button>
            </View>
          )}

          {sheet === 'mode' && (
            <View style={sheetBg}>
              {handle}
              <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, marginBottom: 16, letterSpacing: -0.3}}>
                How do you want to log?
              </Text>

              <TouchableRipple onPress={handleCamera} borderless style={{borderRadius: 16, marginBottom: 10}}>
                <View style={[{
                  backgroundColor: c.surface, borderRadius: 16, padding: 18,
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                }, theme.dark ? {backgroundColor: c.surfaceVariant} : cardShadow]}>
                  <Text style={{fontSize: 26}}>📷</Text>
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Use Camera</Text>
                    <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 2}}>Auto-count with pose detection</Text>
                  </View>
                  <Text style={{color: c.onSurfaceVariant, fontSize: 18}}>›</Text>
                </View>
              </TouchableRipple>

              <TouchableRipple onPress={() => setSheet('manual')} borderless style={{borderRadius: 16, marginBottom: 16}}>
                <View style={[{
                  backgroundColor: c.surface, borderRadius: 16, padding: 18,
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                }, theme.dark ? {backgroundColor: c.surfaceVariant} : cardShadow]}>
                  <Text style={{fontSize: 26}}>✏️</Text>
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Enter Manually</Text>
                    <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 2}}>Just type the number</Text>
                  </View>
                  <Text style={{color: c.onSurfaceVariant, fontSize: 18}}>›</Text>
                </View>
              </TouchableRipple>

              <Button mode="text" onPress={closeSheet} style={{marginTop: 4}}>
                Cancel
              </Button>
            </View>
          )}


          {sheet === 'manual' && (
              <View style={sheetBg}>
                {handle}
                <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, marginBottom: 4, letterSpacing: -0.3}}>
                  How many did you do?
                </Text>
                <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 16}}>
                  Bank: {totalReps.toLocaleString()} reps
                </Text>
                <TextInput
                  mode="outlined"
                  value={manualInput}
                  onChangeText={setManualInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  autoFocus
                  maxLength={4}
                  contentStyle={{fontSize: 48, fontWeight: '800', textAlign: 'center', color: c.primary}}
                  style={{marginBottom: manualInput.length > 0 && !parseInt(manualInput, 10) ? 4 : 20}}
                />
                {manualInput.length > 0 && !parseInt(manualInput, 10) && (
                  <Text style={{color: c.error, fontSize: 12, marginBottom: 16}}>Enter a number greater than 0</Text>
                )}
                <Button
                  mode="contained"
                  onPress={submitManual}
                  disabled={!parseInt(manualInput, 10)}
                  contentStyle={{paddingVertical: 8}}
                  style={{marginBottom: 12}}>
                  Add to Bank
                </Button>
                <Button mode="text" onPress={() => setSheet('mode')}>← Back</Button>
              </View>
          )}
        </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Title chooser — full screen */}
      <Modal
        visible={sheet === 'titles'}
        animationType="slide"
        onRequestClose={closeSheet}>
        <View style={{flex: 1, backgroundColor: c.background, paddingTop: insets.top}}>
          <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4}}>
            <IconButton icon="chevron-left" size={26} onPress={closeSheet} iconColor={c.onSurface} />
            <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, letterSpacing: -0.3}}>
              Choose Your Title
            </Text>
          </View>
          <Text style={{fontSize: 13, color: c.onSurfaceVariant, paddingHorizontal: 28, marginBottom: 12}}>
            Tap any title you've earned to equip it.
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 28, paddingBottom: 32 + insets.bottom}}>
            <TouchableOpacity
              onPress={() => { setEquippedTitle(null); closeSheet(); }}
              activeOpacity={0.7}
              style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12}}>
              <View style={{flex: 1}}>
                <Text style={{fontSize: 16, fontWeight: '700', color: !equippedTitle ? c.primary : c.onSurface}}>
                  Auto
                </Text>
                <Text style={{fontSize: 12, color: c.onSurfaceVariant, marginTop: 2}}>
                  Always shows your highest earned title ({getTitle(totalReps, currentStreak)})
                </Text>
              </View>
              {!equippedTitle && <Icon source="check" size={18} color={c.primary} />}
            </TouchableOpacity>
            <Divider />
            {TITLES.map((title, i) => {
              const isUnlocked = unlockedTitleSet.has(title.label);
              const isEquipped = equippedTitle === title.label;
              return (
                <React.Fragment key={title.label}>
                  <TouchableOpacity
                    onPress={() => { if (isUnlocked) { setEquippedTitle(title.label); closeSheet(); } }}
                    activeOpacity={isUnlocked ? 0.7 : 1}
                    style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, opacity: isUnlocked ? 1 : 0.35}}>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 16, fontWeight: '700', color: isEquipped ? c.primary : c.onSurface}}>
                        {title.label}
                      </Text>
                      <Text style={{fontSize: 12, color: c.onSurfaceVariant, marginTop: 2}}>{title.unlock}</Text>
                    </View>
                    {isEquipped && <Icon source="check" size={18} color={c.primary} />}
                    {!isEquipped && isUnlocked && <Icon source="check-outline" size={18} color={c.onSurfaceVariant} />}
                    {!isUnlocked && <Icon source="lock-outline" size={16} color={c.onSurfaceVariant} />}
                  </TouchableOpacity>
                  {i < TITLES.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Share card */}
      <ShareCardModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        totalReps={totalReps}
        streak={currentStreak}
        weekReps={weekReps}
      />

      {/* Celebration (bonus reps + milestones) */}
      {pendingCelebration && (
        <CelebrationModal
          visible={showCelebration}
          bonus={pendingCelebration.bonus}
          milestone={pendingCelebration.milestone}
          onClose={dismissCelebration}
        />
      )}

      {/* Freeze earned celebration */}
      <FreezeEarnedModal
        visible={showFreezeEarned}
        freezeCount={freezeCount}
        onClose={() => { setShowFreezeEarned(false); clearFreezeEarned(); }}
      />

      <ConfettiCannon ref={confettiRef} count={80} origin={{x: -20, y: 0}} autoStart={false} fadeOut />

      {/* Freeze auto-used toast */}
      <Snackbar
        visible={showFreezeUsedSnack}
        onDismiss={() => { setShowFreezeUsedSnack(false); clearFreezeUsed(); }}
        duration={4000}
        action={{label: 'OK', onPress: () => { setShowFreezeUsedSnack(false); clearFreezeUsed(); }}}
        style={{marginBottom: 80}}>
        ❄️  Freeze used — streak saved!
      </Snackbar>

      {/* Boss defeated celebration */}
      <Modal visible={showBossWin} transparent animationType="fade" onRequestClose={() => setShowBossWin(false)}>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32}}>
          <View style={[{backgroundColor: c.surface, borderRadius: 28, padding: 32, alignItems: 'center', width: '100%'}, theme.dark ? {} : cardShadow]}>
            <Text style={{fontSize: 56, marginBottom: 16}}>🏆</Text>
            <Text style={{fontSize: 24, fontWeight: '800', color: c.onSurface, textAlign: 'center', letterSpacing: -0.5, marginBottom: 10}}>
              You beat {boss.name}!
            </Text>
            <Text style={{fontSize: 15, color: c.onSurfaceVariant, textAlign: 'center', lineHeight: 24, marginBottom: 28}}>
              {weekReps} reps vs their {boss.weekReps}.{'\n'}
              A new rival shows up next week. Stay ready.
            </Text>
            <Button mode="contained" onPress={() => setShowBossWin(false)} contentStyle={{paddingHorizontal: 32, paddingVertical: 8}}>
              Let's go 💪
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}
