import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Dimensions, View, ScrollView, Animated, Vibration, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import {
  Text, Button, Surface, Chip, TextInput,
  TouchableRipple, useTheme, ProgressBar,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import Purchases from 'react-native-purchases';
import {useAlarmStore} from '../../store/alarmStore';
import {useBankStore} from '../../store/bankStore';
import {useOnboardingStore} from '../../store/onboardingStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {requestNotificationPermission, scheduleNudge, cancelNudge} from '../../utils/notifee';

const STEPS = [
  'welcome', 'name-input', 'founder', 'social',
  'quiz-intro', 'q1', 'q1-reflect', 'q2', 'q3', 'q4', 'q56',
  'analyzing', 'persona', 'outcome', 'summary',
  'create-alarm',
  'daily-goal', 'create-reward', 'commitment', 'perm-warn', 'notif-perm', 'streak-reminder', 'battery', 'paywall',
] as const;

type Step = typeof STEPS[number];

const HIDE_BACK = new Set<Step>(['welcome', 'analyzing', 'persona', 'notif-perm', 'paywall']);
const PHASES = ['About You', 'Your Plan', 'Launch'] as const;

const Q1_OPTIONS = [
  'I wake up fine most days',
  'I hit snooze once or twice',
  'I hit snooze until I\'m almost late',
  'I\'ve actually been late because of it',
];
const Q2_OPTIONS = ['I never really work out', 'I work out here and there', 'I\'m pretty consistent'];
const Q2_CARDS = [
  {emoji: '🛋️', label: 'Starting from zero', sub: Q2_OPTIONS[0]},
  {emoji: '🏃', label: 'Occasionally moving', sub: Q2_OPTIONS[1]},
  {emoji: '💪🏽', label: 'Pretty consistent', sub: Q2_OPTIONS[2]},
];
const Q3_OPTIONS = ['I just need to wake up on time', 'I want to get stronger', 'I need a complete reset, both'];
const Q3_CARDS = [
  {emoji: '⏰', label: 'My mornings are a mess', sub: Q3_OPTIONS[0]},
  {emoji: '💪🏽', label: 'I need to get my body back', sub: Q3_OPTIONS[1]},
  {emoji: '🔥', label: 'Full reset. I\'m done coasting', sub: Q3_OPTIONS[2]},
];
const Q4_OPTIONS = ['5 or fewer', 'Around 10', '15–20', 'More than 20'];
const Q4_REPS = [5, 10, 15, 20];
const REWARD_GOALS = [
  'More time before my day starts',
  'A stronger body',
  'Actually hitting my goals',
  'Feeling proud of myself',
  'Just not being late anymore',
];
const TESTIMONIALS = [
  {stars: 5, text: '"I\'d been saying "I\'ll start Monday" for literally 2 years. Day 11 now. Haven\'t snoozed once."', name: 'Marcus, 22'},
  {stars: 5, text: '"I\'ve got a graveyard of fitness apps. This one actually works because you can\'t just skip it."', name: 'Jordan, 19'},
];

function getPersona(q1: number, q2: number): 'sleeper' | 'inconsistent' | 'optimizer' {
  if (q2 === 2 && q1 <= 1) return 'optimizer';
  if (q1 >= 2 && q2 === 0) return 'sleeper';
  return 'inconsistent';
}

const PERSONA_DATA = {
  sleeper: {
    title: '😴 The Sleeper',
    body: 'You\'ve been saying "tomorrow" for months. Tomorrow never came. You feel the gap. PushRise was built for you.',
  },
  inconsistent: {
    title: '⚡ The Restarter',
    body: 'You start strong. Then life happens, you miss a day, and it\'s over. You\'re not lazy. You just need real stakes. Now you do.',
  },
  optimizer: {
    title: '🎯 The Optimizer',
    body: 'You\'re already disciplined, but you know there\'s another level. You don\'t want good mornings. You want great ones, every single day. PushRise is the system.',
  },
};

const CHART_HEIGHTS = [0.15, 0.38, 0.62, 0.9];

function sliderBucket(v: number) {
  if (v <= 5) return 0;
  if (v <= 12) return 1;
  if (v <= 19) return 2;
  return 3;
}
const {width: SCREEN_WIDTH} = Dimensions.get('window');

export default function OnboardingScreen() {
  const theme = useTheme();
  const {addAlarm} = useAlarmStore();
  const {addReward} = useBankStore();
  const {completeOnboarding} = useOnboardingStore();
  const {startTrial} = useSubscriptionStore();
  const settings = useSettingsStore();

  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = STEPS[stepIdx] as Step;
  const phase = stepIdx <= 9 ? 0 : stepIdx <= 14 ? 1 : 2;

  const reviewAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    if (currentStep !== 'social') return;
    reviewAnims.forEach(a => a.setValue(0));
    Animated.stagger(150, reviewAnims.map(a =>
      Animated.spring(a, {toValue: 1, useNativeDriver: true, tension: 60, friction: 8})
    )).start();
  }, [currentStep]);

  const [userName, setUserName] = useState('');

  const [q1, setQ1] = useState(-1);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const snoozeCountRef = useRef(0);
  const q1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [q1Progress, setQ1Progress] = useState(1);
  const q1ProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [floatingZzz, setFloatingZzz] = useState<Array<{id: number; y: Animated.Value; opacity: Animated.Value}>>([]);
  const zzzCounterRef = useRef(0);
  const [q2, setQ2] = useState(-1);
  const [q3, setQ3] = useState(-1);
  const [q4, setQ4] = useState(-1);
  const [sliderVal, setSliderVal] = useState(10);
  const [rewardGoals, setRewardGoals] = useState<number[]>([]);

  const [wakeTime, setWakeTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(7, 0, 0, 0); return d;
  });
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [alarmTime, setAlarmTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(7, 0, 0, 0); return d;
  });
  const [showAlarmPicker, setShowAlarmPicker] = useState(false);
  const [alarmReps, setAlarmReps] = useState('10');
  const [reminderTime, setReminderTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(21, 0, 0, 0); return d;
  });
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [dailyGoalInput, setDailyGoalInput] = useState('');
  const [rewardEmoji, setRewardEmoji] = useState('🏆');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(50);
  const rewardHeroAnim = useRef(new Animated.Value(1)).current;
  const [grindingFor, setGrindingFor] = useState('');
  const [commitSigned, setCommitSigned] = useState(false);
  const commitSealAnim = useRef(new Animated.Value(0)).current;

  const [offerings, setOfferings] = useState<any>(null);
  const [selectedPkgType, setSelectedPkgType] = useState<'annual' | 'weekly' | 'lifetime'>('annual');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const viewTypeAnim = useRef(new Animated.Value(0)).current;
  const personaCardAnim = useRef(new Animated.Value(0)).current;
  const chartBarAnims = useRef(CHART_HEIGHTS.map(() => new Animated.Value(0))).current;

  // #19 — slide in from right (or left when going back) on each step change
  const slideX = useRef(new Animated.Value(0)).current;
  const prevStepRef = useRef(stepIdx);
  useEffect(() => {
    if (stepIdx === prevStepRef.current) return;
    const dir = stepIdx > prevStepRef.current ? 1 : -1;
    slideX.setValue(dir * SCREEN_WIDTH * 0.35);
    Animated.spring(slideX, {toValue: 0, useNativeDriver: true, tension: 70, friction: 11}).start();
    prevStepRef.current = stepIdx;
  }, [stepIdx]);

  const q1Cards = useRef(Q1_OPTIONS.map(() => new Animated.Value(0))).current;
  const q2Cards = useRef(Q2_OPTIONS.map(() => new Animated.Value(0))).current;
  const q3Cards = useRef(Q3_OPTIONS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const map: Partial<Record<Step, Animated.Value[]>> = {q1: q1Cards, q2: q2Cards, q3: q3Cards};
    const anims = map[currentStep];
    if (!anims) return;
    anims.forEach(a => a.setValue(0));
    Animated.stagger(80, anims.map(a =>
      Animated.timing(a, {toValue: 1, duration: 280, useNativeDriver: true})
    )).start();
  }, [currentStep]);

  const barAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const [analyzeLines, setAnalyzeLines] = useState(0);
  const [personaCharCount, setPersonaCharCount] = useState(0);
  const [analyzeComplete, setAnalyzeComplete] = useState(false);

  const persona = useMemo(() => getPersona(q1, q2), [q1, q2]);
  const recommendedReps = Q4_REPS[Math.max(0, q4)] ?? 10;

  const next = () => setStepIdx(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    if (currentStep === 'outcome' || currentStep === 'summary') {
      setStepIdx(s => s - 2);
    } else {
      setStepIdx(s => Math.max(s - 1, 0));
    }
  };

  useEffect(() => {
    if (currentStep === 'create-alarm') {
      setAlarmTime(wakeTime);
      setAlarmReps(String(recommendedReps));
    }
  }, [currentStep]);

  const startQ1Timer = () => {
    if (q1TimerRef.current) clearTimeout(q1TimerRef.current);
    if (q1ProgressIntervalRef.current) clearInterval(q1ProgressIntervalRef.current);
    setQ1Progress(1);
    const start = Date.now();
    q1ProgressIntervalRef.current = setInterval(() => {
      const p = Math.max(0, 1 - (Date.now() - start) / 5000);
      setQ1Progress(p);
      if (p <= 0) { clearInterval(q1ProgressIntervalRef.current!); q1ProgressIntervalRef.current = null; }
    }, 50);
    q1TimerRef.current = setTimeout(() => {
      if (q1ProgressIntervalRef.current) { clearInterval(q1ProgressIntervalRef.current); q1ProgressIntervalRef.current = null; }
      const c = snoozeCountRef.current;
      setQ1(c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : 3);
      setStepIdx(s => Math.min(s + 1, STEPS.length - 1));
    }, 5000);
  };

  useEffect(() => {
    if (currentStep !== 'q1') return;
    snoozeCountRef.current = 0;
    setSnoozeCount(0);
    setFloatingZzz([]);
    startQ1Timer();
    return () => {
      if (q1TimerRef.current) clearTimeout(q1TimerRef.current);
      if (q1ProgressIntervalRef.current) clearInterval(q1ProgressIntervalRef.current);
    };
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 'analyzing') return;
    barAnims.forEach(a => a.setValue(0));
    viewTypeAnim.setValue(0);
    setAnalyzeLines(0);
    setPersonaCharCount(0);
    setAnalyzeComplete(false);
    const personaTitle = PERSONA_DATA[persona].title;
    const barFills = [
      Math.max(0.25, (q1 + 1) / 4),
      Math.max(0.33, (q2 + 1) / 3),
      1.0,
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let nameInterval: ReturnType<typeof setInterval> | null = null;
    const runningAnims: Animated.CompositeAnimation[] = [];
    [0, 1, 2].forEach(i => {
      const t = setTimeout(() => {
        setAnalyzeLines(i + 1);
        const anim = Animated.timing(barAnims[i], {toValue: barFills[i], duration: 650, useNativeDriver: false});
        runningAnims.push(anim);
        anim.start();
      }, i * 800);
      timers.push(t);
    });
    const nameTimer = setTimeout(() => {
      let charIdx = 0;
      nameInterval = setInterval(() => {
        charIdx++;
        setPersonaCharCount(charIdx);
        if (charIdx >= personaTitle.length) {
          if (nameInterval) clearInterval(nameInterval);
          nameInterval = null;
          timers.push(setTimeout(() => setAnalyzeComplete(true), 400));
        }
      }, 65);
    }, 3 * 800 + 300);
    timers.push(nameTimer);
    return () => {
      timers.forEach(clearTimeout);
      if (nameInterval) clearInterval(nameInterval);
      runningAnims.forEach(a => a.stop());
    };
  }, [currentStep]);

  useEffect(() => {
    if (!analyzeComplete) return;
    Animated.spring(viewTypeAnim, {toValue: 1, useNativeDriver: true, tension: 60, friction: 8}).start();
  }, [analyzeComplete]);

  useEffect(() => {
    if (currentStep !== 'persona') return;
    personaCardAnim.setValue(0);
    Animated.spring(personaCardAnim, {toValue: 1, useNativeDriver: true, tension: 60, friction: 8, delay: 150}).start();
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 'outcome') return;
    chartBarAnims.forEach(a => a.setValue(0));
    Animated.stagger(180, CHART_HEIGHTS.map((h, i) =>
      Animated.timing(chartBarAnims[i], {toValue: h * 140, duration: 500, useNativeDriver: false})
    )).start();
  }, [currentStep]);

  const handleComplete = async () => {
    if (rewardTitle.trim()) {
      addReward({emoji: rewardEmoji, title: rewardTitle.trim(), cost: rewardCost});
    }
    await addAlarm({
      hour: alarmTime.getHours(),
      minute: alarmTime.getMinutes(),
      reps: parseInt(alarmReps, 10) || 10,
      label: '',
      days: [],
      volume: 1.0,
      sound: 'alarm.mp3',
    });
    settings.update({userName: userName.trim()});
    startTrial();
    completeOnboarding();
  };

  const handleSnooze = () => {
    Vibration.vibrate(50);
    const newCount = snoozeCountRef.current + 1;
    snoozeCountRef.current = newCount;
    setSnoozeCount(newCount);
    startQ1Timer();
    const id = zzzCounterRef.current++;
    const y = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    setFloatingZzz(prev => [...prev, {id, y, opacity}]);
    Animated.parallel([
      Animated.timing(y, {toValue: -130, duration: 1400, useNativeDriver: true}),
      Animated.timing(opacity, {toValue: 0, duration: 1400, useNativeDriver: true}),
    ]).start(() => setFloatingZzz(prev => prev.filter(z => z.id !== id)));
  };

  const advanceQ1 = () => {
    if (q1TimerRef.current) clearTimeout(q1TimerRef.current);
    const c = snoozeCountRef.current;
    setQ1(c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : 3);
    next();
  };

  const toggleRewardGoal = (i: number) =>
    setRewardGoals(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  useEffect(() => {
    Purchases.getOfferings().then(setOfferings).catch(() => {});
  }, []);

  const handlePurchase = async () => {
    const pkg = offerings?.current?.availablePackages?.find((p: any) => {
      if (selectedPkgType === 'annual') return p.packageType === Purchases.PACKAGE_TYPE.ANNUAL;
      if (selectedPkgType === 'weekly') return p.packageType === Purchases.PACKAGE_TYPE.WEEKLY;
      return p.packageType === Purchases.PACKAGE_TYPE.LIFETIME;
    });
    if (!pkg || purchaseLoading) return;
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      await Purchases.purchasePackage(pkg);
      await handleComplete();
    } catch (e: any) {
      if (!e.userCancelled) setPurchaseError('Purchase failed. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // ─── Step renders ─────────────────────────────────────────────────────────────

  const renderContent = () => {
    const name = userName.trim();
    switch (currentStep) {

      case 'welcome':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="labelLarge" style={{color: theme.colors.primary, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32}}>
              PushRise
            </Text>
            <Text variant="displaySmall" style={{fontWeight: '800', lineHeight: 44, marginBottom: 16}}>
              You're tired of being{'\n'}the guy who could.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              Potential means nothing without action. Every snooze takes you further from who you want to be. That changes now.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              I'm done →
            </Button>
          </View>
        );

      case 'name-input':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="displaySmall" style={{fontWeight: '800', lineHeight: 44, marginBottom: 16}}>
              What do we{'\n'}call you?
            </Text>
            <TextInput
              mode="outlined"
              label="First name"
              value={userName}
              onChangeText={setUserName}
              autoFocus
              maxLength={30}
              style={{marginBottom: 28}}
            />
            <Button
              mode="contained"
              disabled={!name}
              onPress={next}
              contentStyle={{paddingVertical: 8}}>
              Let's go →
            </Button>
          </View>
        );

      case 'founder':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Surface elevation={1} style={{borderRadius: 20, padding: 24, marginBottom: 24}}>
              <Text style={{fontSize: 80, fontWeight: '900', color: theme.colors.primary, lineHeight: 60, marginBottom: 12}}>
                "
              </Text>
              <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 28, fontStyle: 'italic', marginBottom: 24}}>
                {"I was you. Snoozed every alarm, skipped every workout, told myself tomorrow. I knew what I could do, and I was wasting it. So I built something to keep me honest. Now I wake up knowing I already won. You can too."}
              </Text>
              <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'right'}}>
                Syreese
              </Text>
            </Surface>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Let's do this →
            </Button>
          </View>
        );

      case 'social':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 20}}>
              Real people. Real results.
            </Text>
            {TESTIMONIALS.map((t, i) => (
              <Animated.View key={i} style={{
                opacity: reviewAnims[i],
                transform: [{translateY: reviewAnims[i].interpolate({inputRange: [0, 1], outputRange: [30, 0]})}],
              }}>
                <Surface elevation={1} style={{borderRadius: 16, padding: 20, marginBottom: 12}}>
                  <Text style={{color: theme.colors.primary, fontSize: 14, marginBottom: 10}}>
                    {'★'.repeat(t.stars)}
                  </Text>
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, lineHeight: 24, fontStyle: 'italic', marginBottom: 10}}>
                    {t.text}
                  </Text>
                  <Text variant="labelMedium" style={{color: theme.colors.onSurface}}>{t.name}</Text>
                </Surface>
              </Animated.View>
            ))}
            <Button mode="contained" onPress={next} style={{marginTop: 8}} contentStyle={{paddingVertical: 8}}>
              Continue →
            </Button>
          </View>
        );

      case 'quiz-intro':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="displaySmall" style={{fontWeight: '800', lineHeight: 44, marginBottom: 16}}>
              Let's figure out{'\n'}why you keep stopping.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              Not judging. Diagnosing. We need the truth to build {name ? `${name}'s` : 'your'} plan.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Tell the truth →
            </Button>
          </View>
        );

      case 'q1': {
        const snoozeSubtext = () => {
          if (snoozeCount === 0) return 'Go ahead, tap it...';
          if (snoozeCount <= 2) return 'Just 5 more minutes...';
          if (snoozeCount <= 4) return 'Warm and cozy...';
          return "Okay, we've got some work to do! 😳";
        };
        return (
          <View style={{flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: 16, paddingBottom: 40}}>
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
              <Text variant="headlineSmall" style={{fontWeight: '700', textAlign: 'center', marginBottom: 48}}>
                How often do you hit snooze?
              </Text>
              {/* ponytail: static random translateX per particle — good enough for visual scatter */}
              <View style={{width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 32}} pointerEvents="none">
                {floatingZzz.map(z => (
                  <Animated.Text key={z.id} style={{
                    position: 'absolute',
                    fontSize: 32,
                    opacity: z.opacity,
                    transform: [{translateY: z.y}, {translateX: (Math.random() * 40 - 20)}],
                  }}>
                    💤
                  </Animated.Text>
                ))}
                <Text style={{fontSize: 72}}>😴</Text>
              </View>
              {snoozeCount > 0 && (
                <Text variant="headlineMedium" style={{fontWeight: '800', color: theme.colors.primary, marginBottom: 8, textAlign: 'center'}}>
                  Snoozed {snoozeCount}×
                </Text>
              )}
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, marginBottom: 48, textAlign: 'center'}}>
                {snoozeSubtext()}
              </Text>
              <Button
                mode="contained"
                onPress={handleSnooze}
                contentStyle={{paddingVertical: 14, paddingHorizontal: 40}}>
                😴  Snooze
              </Button>
              <Button mode="text" onPress={advanceQ1} style={{marginTop: 20}}>
                Done
              </Button>
            </View>
            <ProgressBar progress={q1Progress} style={{height: 4, borderRadius: 2}} />
          </View>
        );
      }

      case 'q1-reflect':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="displaySmall" style={{fontWeight: '800', lineHeight: 44, marginBottom: 16}}>
              {name ? `${name}, that's` : "That's"} the habit{'\n'}killing your mornings.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              Not laziness. An untrained reflex. Every time you hit snooze, you trained yourself to quit. We're going to undo that.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Let's undo it →
            </Button>
          </View>
        );

      case 'q2':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 20}}>
              How far have you let yourself slide? Be real.
            </Text>
            {Q2_CARDS.map((card, i) => (
              <Animated.View key={i} style={{opacity: q2Cards[i], transform: [{translateY: q2Cards[i].interpolate({inputRange: [0, 1], outputRange: [20, 0]})}]}}>
                <TouchableRipple onPress={() => { setQ2(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                  <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                      <Text style={{fontSize: 40}}>{card.emoji}</Text>
                      <View style={{flex: 1}}>
                        <Text variant="titleMedium" style={{fontWeight: '700'}}>{card.label}</Text>
                        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 2}}>{card.sub}</Text>
                      </View>
                    </View>
                  </Surface>
                </TouchableRipple>
              </Animated.View>
            ))}
          </View>
        );

      case 'q3':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 20}}>
              What made you finally download this?
            </Text>
            {Q3_CARDS.map((card, i) => (
              <Animated.View key={i} style={{opacity: q3Cards[i], transform: [{translateY: q3Cards[i].interpolate({inputRange: [0, 1], outputRange: [20, 0]})}]}}>
                <TouchableRipple onPress={() => { setQ3(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                  <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                      <Text style={{fontSize: 40}}>{card.emoji}</Text>
                      <View style={{flex: 1}}>
                        <Text variant="titleMedium" style={{fontWeight: '700'}}>{card.label}</Text>
                        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 2}}>{card.sub}</Text>
                      </View>
                    </View>
                  </Surface>
                </TouchableRipple>
              </Animated.View>
            ))}
          </View>
        );

      case 'q4': {
        const bucket = sliderBucket(sliderVal);
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 32, justifyContent: 'center'}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 48, textAlign: 'center'}}>
              How many push-ups can you actually do? No ego.
            </Text>
            <Text style={{fontSize: 96, fontWeight: '200', textAlign: 'center', color: theme.colors.primary, letterSpacing: -4, lineHeight: 104}}>
              {sliderVal >= 50 ? '50+' : sliderVal}
            </Text>
            <Text variant="titleMedium" style={{textAlign: 'center', color: theme.colors.onSurfaceVariant, marginBottom: 40, marginTop: 8}}>
              {Q4_OPTIONS[bucket]}
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 48, gap: 32}}>
              <TouchableRipple
                onPress={() => setSliderVal(v => Math.max(1, v - 5))}
                borderless
                style={{padding: 16, borderRadius: 40, backgroundColor: theme.colors.surfaceVariant}}>
                <Text style={{fontSize: 28, lineHeight: 32, color: theme.colors.onSurfaceVariant}}>−</Text>
              </TouchableRipple>
              <TouchableRipple
                onPress={() => setSliderVal(v => Math.min(50, v + 5))}
                borderless
                style={{padding: 16, borderRadius: 40, backgroundColor: theme.colors.primary}}>
                <Text style={{fontSize: 28, lineHeight: 32, color: theme.colors.onPrimary}}>+</Text>
              </TouchableRipple>
            </View>
            <Button
              mode="contained"
              onPress={() => { setQ4(bucket); next(); }}
              contentStyle={{paddingVertical: 8}}>
              That's my number
            </Button>
          </View>
        );
      }

      case 'q56':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', marginBottom: 16}}>
              When do you need to wake up?
            </Text>
            <TouchableRipple onPress={() => setShowWakePicker(true)} style={{alignItems: 'center', paddingVertical: 16, marginBottom: 8}}>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 64, fontWeight: '200', letterSpacing: -2, color: theme.colors.onSurface}}>
                  {wakeTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </Text>
                <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>Tap to change</Text>
              </View>
            </TouchableRipple>
            {showWakePicker && (
              <DateTimePicker
                value={wakeTime}
                mode="time"
                display="default"
                onChange={(e, d) => { setShowWakePicker(false); if (e.type !== 'dismissed' && d) setWakeTime(d); }}
              />
            )}

            <Text variant="headlineSmall" style={{fontWeight: '700', marginTop: 24, marginBottom: 16}}>
              What would make waking up worth it?
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24}}>
              {REWARD_GOALS.map((g, i) => (
                <Chip
                  key={i}
                  selected={rewardGoals.includes(i)}
                  onPress={() => toggleRewardGoal(i)}>
                  {g}
                </Chip>
              ))}
            </View>

            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Continue →
            </Button>
          </View>
        );

      case 'analyzing': {
        const personaTitle = PERSONA_DATA[persona].title;
        const statRows = [
          {label: 'Snooze severity', value: Q1_OPTIONS[Math.max(0, q1)]},
          {label: 'Fitness level', value: Q2_OPTIONS[Math.max(0, q2)]},
          {label: 'Goal', value: Q3_OPTIONS[Math.max(0, q3)]},
        ];
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 64, justifyContent: 'center', alignItems: 'center'}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 48, alignSelf: 'flex-start'}}>
              Building your plan…
            </Text>
            {statRows.map((row, i) => (
              analyzeLines > i ? (
                <View key={i} style={{marginBottom: 28, width: '100%', alignItems: 'center'}}>
                  <Text variant="labelSmall" style={{
                    color: theme.colors.onSurfaceVariant,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 8,
                    alignSelf: 'flex-start',
                  }}>
                    {row.label}
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%'}}>
                    <View style={{
                      width: '60%', height: 8,
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: 4, overflow: 'hidden',
                    }}>
                      <Animated.View style={{
                        height: '100%',
                        borderRadius: 4,
                        width: barAnims[i].interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}),
                      }}>
                        <LinearGradient
                          colors={['#FF6B00', '#FF2D00']}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 0}}
                          style={{width: '100%', height: '100%', borderRadius: 4}}
                        />
                      </Animated.View>
                    </View>
                    <Text variant="bodySmall" style={{color: theme.colors.onSurface, flex: 1}} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                </View>
              ) : null
            ))}
            {analyzeLines >= 3 && personaCharCount > 0 && (
              <Text variant="headlineMedium" style={{
                fontWeight: '800',
                color: theme.colors.primary,
                marginTop: 28,
                letterSpacing: 0.5,
                alignSelf: 'flex-start',
              }}>
                {personaTitle.slice(0, personaCharCount)}
              </Text>
            )}
            {analyzeComplete && (
              <Animated.View style={{
                marginTop: 32,
                opacity: viewTypeAnim,
                transform: [{scale: viewTypeAnim.interpolate({inputRange: [0, 1], outputRange: [0.85, 1]})}],
                alignSelf: 'flex-start',
              }}>
                <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
                  View Your Type →
                </Button>
              </Animated.View>
            )}
          </View>
        );
      }

      case 'persona': {
        const p = PERSONA_DATA[persona];
        const emoji = p.title.split(' ')[0];
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Animated.View style={{
              opacity: personaCardAnim,
              transform: [{scale: personaCardAnim.interpolate({inputRange: [0, 1], outputRange: [0.92, 1]})}],
              marginBottom: 32,
              borderRadius: 20,
              overflow: 'hidden',
            }}>
              <Surface elevation={2} style={{
                borderRadius: 20,
              }}>
                <LinearGradient
                  colors={['#FF6B00', '#FF2D00']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{height: 80, justifyContent: 'center', alignItems: 'center'}}
                >
                  <Text style={{fontSize: 48, lineHeight: 56}}>{emoji}</Text>
                </LinearGradient>
                <View style={{padding: 28}}>
                  <Text variant="labelLarge" style={{color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8}}>
                    {name ? `${name}'s type` : 'Your type'}
                  </Text>
                  <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 16}}>{p.title}</Text>
                  <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26}}>{p.body}</Text>
                </View>
              </Surface>
            </Animated.View>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              That's me →
            </Button>
          </View>
        );
      }

      case 'outcome':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="displaySmall" style={{fontWeight: '800', marginBottom: 20}}>
              In 30 days,{'\n'}you won't recognize your mornings.
            </Text>
            <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20}}>
              Push-ups per week
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 200, marginBottom: 32}}>
              {CHART_HEIGHTS.map((h, i) => {
                const projectedReps = Math.round(recommendedReps * 7 * h);
                return (
                  <View key={i} style={{flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 8}}>
                    <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600'}}>
                      ~{projectedReps}
                    </Text>
                    <Animated.View style={{
                      width: '100%',
                      height: chartBarAnims[i],
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}>
                      <LinearGradient
                        colors={['#FF6B00', '#FF2D00']}
                        start={{x: 0, y: 1}}
                        end={{x: 0, y: 0}}
                        style={{width: '100%', height: '100%', opacity: 0.9}}
                      />
                    </Animated.View>
                    <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant}}>Wk {i + 1}</Text>
                  </View>
                );
              })}
            </View>
            <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, lineHeight: 22, marginBottom: 32}}>
              You'll wake up before the alarm. You'll do the reps without thinking twice. You'll feel it in how you carry yourself. Not because you forced it. Because it's who you are now.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              I want that →
            </Button>
          </View>
        );

      case 'summary': {
        const goalLabel = Q3_OPTIONS[Math.max(0, q3)] ?? 'Get better';
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <LinearGradient
              colors={['#FF6B00', '#FF2D00']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{borderRadius: 20, padding: 20, marginBottom: -20, zIndex: 1}}
            >
              <Text variant="labelLarge" style={{color: '#FFFFFF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center'}}>
                Your Plan Is Ready
              </Text>
              {name && (
                <Text style={{color: '#FFFFFF', fontSize: 14, marginTop: 4, textAlign: 'center', fontStyle: 'italic'}}>
                  {name}
                </Text>
              )}
            </LinearGradient>
            <Surface elevation={1} style={{borderRadius: 20, paddingTop: 44, paddingHorizontal: 24, paddingBottom: 24, marginBottom: 24, gap: 20}}>
              {([
                ['⏰', 'Wake time', wakeTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})],
                ['💪', 'Starting reps', `${recommendedReps} push-ups`],
                ['🎯', 'Goal', goalLabel],
              ] as const).map(([icon, label, value]) => (
                <View key={label} style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                  <View style={{
                    width: 48, height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.colors.primaryContainer,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{fontSize: 24}}>{icon}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5}}>
                      {label}
                    </Text>
                    <Text variant="titleMedium" style={{marginTop: 2}}>{value}</Text>
                  </View>
                </View>
              ))}
            </Surface>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, textAlign: 'center', marginBottom: 32}}>
              This is the plan.{'\n'}Show up tomorrow.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Set Your First Alarm →
            </Button>
          </View>
        );
      }

      case 'create-alarm':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              Set it. Don't overthink.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 24}}>
              Pick a time you actually need to wake up.
            </Text>

            <TouchableRipple onPress={() => setShowAlarmPicker(true)} style={{alignItems: 'center', paddingVertical: 16, marginBottom: 8}}>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 64, fontWeight: '200', letterSpacing: -2, color: theme.colors.onSurface}}>
                  {alarmTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </Text>
                <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>Tap to change</Text>
              </View>
            </TouchableRipple>
            {showAlarmPicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={(e, d) => { setShowAlarmPicker(false); if (e.type !== 'dismissed' && d) setAlarmTime(d); }}
              />
            )}

            <TextInput
              mode="outlined"
              label="Push-ups to dismiss"
              value={alarmReps}
              onChangeText={setAlarmReps}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
              contentStyle={{fontSize: 36, fontWeight: '300', color: theme.colors.primary}}
              style={{width: 180, marginBottom: 32}}
            />

            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Set My Alarm →
            </Button>
          </View>
        );

      case 'daily-goal': {
        const GOAL_TIERS = [
          {value: 25, emoji: '🌱', tier: 'Warm-Up', desc: 'Build the habit first'},
          {value: 50, emoji: '💪🏽', tier: 'Committed', desc: 'The recommended start'},
          {value: 100, emoji: '🔥', tier: 'Serious', desc: 'You mean business'},
          {value: 200, emoji: '⚡', tier: 'Elite', desc: 'Beast territory'},
        ];
        const selectedGoal = parseInt(dailyGoalInput, 10);
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              How hard are you willing to push?
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 28}}>
              This is your daily minimum. The floor, not the ceiling.
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28}}>
              {GOAL_TIERS.map(({value, emoji, tier, desc}) => (
                <TouchableRipple
                  key={value}
                  onPress={() => setDailyGoalInput(String(value))}
                  borderless
                  style={{flex: 1, minWidth: '47%', borderRadius: 16}}>
                  <Surface
                    elevation={0}
                    style={{
                      borderRadius: 16, padding: 16, alignItems: 'center',
                      backgroundColor: selectedGoal === value ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderWidth: selectedGoal === value ? 2 : 0,
                      borderColor: theme.colors.primary,
                    }}>
                    <Text style={{fontSize: 32, marginBottom: 8}}>{emoji}</Text>
                    <Text style={{
                      fontSize: 18, fontWeight: '800',
                      color: selectedGoal === value ? theme.colors.primary : theme.colors.onSurface,
                    }}>{value}</Text>
                    <Text style={{fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 2}}>reps</Text>
                    <Text style={{fontSize: 11, fontWeight: '700', color: theme.colors.onSurface, marginTop: 8, textAlign: 'center'}}>
                      {tier}
                    </Text>
                    <Text style={{fontSize: 9, color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center'}}>
                      {desc}
                    </Text>
                  </Surface>
                </TouchableRipple>
              ))}
            </View>
            <TextInput
              mode="outlined"
              label="Or enter a custom number"
              value={dailyGoalInput}
              onChangeText={v => setDailyGoalInput(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={4}
              style={{marginBottom: 24}}
            />
            <Button
              mode="contained"
              disabled={!selectedGoal || selectedGoal < 1}
              onPress={() => { settings.update({dailyGoal: selectedGoal}); next(); }}
              contentStyle={{paddingVertical: 8}}
              style={{marginBottom: 12}}>
              Set My Standard →
            </Button>
            <Button mode="text" onPress={next}>Skip for now</Button>
          </View>
        );
      }

      case 'create-reward': {
        const REWARD_EMOJI_PRESETS = ['🎮','🍕','☕','👟','💵','🏖️'];
        const COST_PRESETS = [25, 50, 100, 200];
        const selectEmoji = (e: string) => {
          setRewardEmoji(e);
          rewardHeroAnim.setValue(0.75);
          Animated.spring(rewardHeroAnim, {toValue: 1, useNativeDriver: true, tension: 120, friction: 6}).start();
        };
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', lineHeight: 38, marginBottom: 28}}>
              What are you grinding for?
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 20}}>
              Name the thing you want. Every push-up is earning it.
            </Text>

            {/* Hero emoji */}
            <Animated.View style={{alignSelf: 'center', marginBottom: 20, transform: [{scale: rewardHeroAnim}]}}>
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: theme.colors.primaryContainer,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: theme.colors.primary,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 6,
              }}>
                <Text style={{fontSize: 52, lineHeight: 60}}>{rewardEmoji}</Text>
              </View>
            </Animated.View>

            {/* Emoji picker */}
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24}}>
              {REWARD_EMOJI_PRESETS.map(e => (
                <TouchableRipple
                  key={e}
                  onPress={() => selectEmoji(e)}
                  borderless
                  style={{borderRadius: 14}}>
                  <View style={{
                    width: 52, height: 52, borderRadius: 14,
                    backgroundColor: rewardEmoji === e ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: rewardEmoji === e ? 2 : 0,
                    borderColor: theme.colors.primary,
                  }}>
                    <Text style={{fontSize: 26}}>{e}</Text>
                  </View>
                </TouchableRipple>
              ))}
            </View>

            {/* Name input */}
            <TextInput
              mode="outlined"
              label="New shoes, TV Time, etc"
              value={rewardTitle}
              onChangeText={setRewardTitle}
              maxLength={40}
              style={{marginBottom: 20}}
            />

            {/* Cost presets */}
            <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5}}>
              Worth how many push-ups?
            </Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 32}}>
              {COST_PRESETS.map(n => (
                <TouchableRipple
                  key={n}
                  onPress={() => setRewardCost(n)}
                  borderless
                  style={{flex: 1, borderRadius: 14}}>
                  <Surface
                    elevation={0}
                    style={{
                      borderRadius: 14, padding: 14, alignItems: 'center',
                      backgroundColor: rewardCost === n ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderWidth: rewardCost === n ? 2 : 0,
                      borderColor: theme.colors.primary,
                    }}>
                    <Text style={{
                      fontSize: 20, fontWeight: '800',
                      color: rewardCost === n ? theme.colors.primary : theme.colors.onSurface,
                    }}>{n}</Text>
                    <Text style={{fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 2}}>reps</Text>
                  </Surface>
                </TouchableRipple>
              ))}
            </View>

            <Button
              mode="contained"
              disabled={!rewardTitle.trim()}
              onPress={next}
              contentStyle={{paddingVertical: 8}}
              style={{marginBottom: 12}}>
              Lock It In →
            </Button>
            <Button mode="text" onPress={next}>Skip for now</Button>
          </View>
        );
      }

      case 'commitment': {
        const canContinue = grindingFor.trim().length > 2;
        const timeStr = alarmTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        const handleLockIn = () => {
          Vibration.vibrate([0, 60, 40, 120]);
          setCommitSigned(true);
          commitSealAnim.setValue(0);
          Animated.spring(commitSealAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 55,
            friction: 6,
          }).start();
          setTimeout(() => { settings.update({grindingFor: grindingFor.trim()}); next(); }, 900);
        };

        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Surface elevation={1} style={{
              borderRadius: 16,
              marginBottom: 20,
              overflow: 'hidden',
            }}>
              <LinearGradient
                colors={['#FF6B00', '#FF2D00']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{height: 64, justifyContent: 'center', alignItems: 'center'}}
              >
                <Text style={{color: '#FFFFFF', fontWeight: '900', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase'}}>
                  Morning Contract
                </Text>
              </LinearGradient>

              <View style={{padding: 24}}>
                <Text variant="bodyLarge" style={{lineHeight: 30, marginBottom: 24}}>
                  {"I, "}
                  <Text style={{color: theme.colors.primary, fontWeight: '700'}}>{name || 'I'}</Text>
                  {", will rise at "}
                  <Text style={{color: theme.colors.primary, fontWeight: '700'}}>{timeStr}</Text>
                  {" and do "}
                  <Text style={{color: theme.colors.primary, fontWeight: '700'}}>{recommendedReps}</Text>
                  {" push-ups."}
                </Text>

                <Text variant="labelSmall" style={{
                  color: theme.colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 8,
                  fontWeight: '700',
                }}>
                  Why this matters
                </Text>

                <TextInput
                  mode="flat"
                  value={grindingFor}
                  onChangeText={setGrindingFor}
                  placeholder="Write your reason here…"
                  multiline
                  numberOfLines={2}
                  maxLength={120}
                  editable={!commitSigned}
                  underlineColor={theme.colors.primary}
                  activeUnderlineColor={theme.colors.primary}
                  style={{marginBottom: 24}}
                />

                <View style={{borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, paddingTop: 16}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={{fontSize: 12, fontWeight: '600', color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5}}>
                      Signed
                    </Text>
                    <Text style={{
                      fontFamily: 'serif', fontStyle: 'italic',
                      fontSize: 26, color: theme.colors.onSurface,
                    }}>
                      {name || 'You'}
                    </Text>
                  </View>
                </View>
              </View>
            </Surface>

            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, textAlign: 'center', marginBottom: 24}}>
              The men who write this down are the ones who actually show up.
            </Text>

            {commitSigned && (
              <Animated.View style={{
                alignSelf: 'center', marginBottom: 20,
                opacity: commitSealAnim,
                transform: [{
                  scale: commitSealAnim.interpolate({inputRange: [0, 1], outputRange: [0.2, 1]})
                }, {
                  rotate: commitSealAnim.interpolate({inputRange: [0, 1], outputRange: ['-30deg', '0deg']})
                }],
              }}>
                <View style={{
                  width: 96, height: 96, borderRadius: 48,
                  backgroundColor: theme.colors.primaryContainer,
                  borderWidth: 3, borderColor: theme.colors.primary,
                  justifyContent: 'center', alignItems: 'center',
                  shadowColor: theme.colors.primary,
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 8,
                }}>
                  <Text style={{fontSize: 48, color: theme.colors.primary}}>✓</Text>
                </View>
              </Animated.View>
            )}

            <Button
              mode="contained"
              disabled={!canContinue || commitSigned}
              onPress={handleLockIn}
              contentStyle={{paddingVertical: 8}}
              style={{marginBottom: 12}}>
              Lock it in
            </Button>
            <Button mode="text" onPress={next} disabled={commitSigned}>Skip</Button>
          </View>
        );
      }

      case 'perm-warn':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              Almost done.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 24}}>
              Two quick permissions so your alarm never fails.
            </Text>
            {[
              {icon: '🔋', title: 'Battery access', sub: 'Keeps alarms firing even in battery saver mode'},
              {icon: '🔔', title: 'Notifications', sub: 'Trial reminders only'},
            ].map(p => (
              <Surface key={p.title} elevation={1} style={{borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 12}}>
                <Text style={{fontSize: 28}}>{p.icon}</Text>
                <View style={{flex: 1}}>
                  <Text variant="titleMedium">{p.title}</Text>
                  <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4, lineHeight: 20}}>
                    {p.sub}
                  </Text>
                </View>
              </Surface>
            ))}
            <Button mode="contained" onPress={next} style={{marginTop: 8}} contentStyle={{paddingVertical: 8}}>
              Got it →
            </Button>
          </View>
        );

      case 'notif-perm':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 16}}>
              Allow notifications
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              We'll only send alarm alerts and trial reminders. Nothing else.
            </Text>
            <Button
              mode="contained"
              onPress={async () => { await requestNotificationPermission(); next(); }}
              contentStyle={{paddingVertical: 8}}
              style={{marginBottom: 12}}>
              Grant Access →
            </Button>
            <Button mode="text" onPress={next}>Skip for now</Button>
          </View>
        );

      case 'streak-reminder':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <View style={{alignItems: 'center', marginBottom: 40}}>
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: theme.colors.primaryContainer,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: theme.colors.primary,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 6,
              }}>
                <Text style={{fontSize: 64}}>🛡️</Text>
              </View>
            </View>

            <Text style={{fontSize: 13, fontWeight: '700', color: theme.colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center'}}>
              Protect your streak
            </Text>
            <Text variant="headlineMedium" style={{fontWeight: '800', lineHeight: 38, marginBottom: 12, textAlign: 'center'}}>
              We'll remind you{'\n'}before midnight.
            </Text>

            <Surface elevation={0} style={{
              borderRadius: 12,
              padding: 16,
              backgroundColor: theme.colors.surfaceVariant,
              marginBottom: 28,
            }}>
              <View style={{flexDirection: 'row', gap: 12, marginBottom: 12}}>
                <Text style={{fontSize: 24}}>🔥</Text>
                <View style={{flex: 1}}>
                  <Text variant="labelMedium" style={{fontWeight: '700', marginBottom: 4}}>
                    PushRise
                  </Text>
                  <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, lineHeight: 18}}>
                    Streak in danger. Log your reps now!
                  </Text>
                </View>
              </View>
            </Surface>

            <TouchableRipple onPress={() => setShowReminderPicker(true)} style={{alignItems: 'center', paddingVertical: 12, marginBottom: 4}}>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 60, fontWeight: '200', letterSpacing: -2, color: theme.colors.onSurface}}>
                  {reminderTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </Text>
                <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>Tap to change</Text>
              </View>
            </TouchableRipple>
            {showReminderPicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="default"
                onChange={(e, d) => {
                  setShowReminderPicker(false);
                  if (e.type !== 'dismissed' && d) setReminderTime(d);
                }}
              />
            )}

            <Button
              mode="contained"
              onPress={async () => {
                settings.update({nudgeEnabled: true, nudgeHour: reminderTime.getHours(), nudgeMinute: reminderTime.getMinutes()});
                await scheduleNudge(reminderTime.getHours(), reminderTime.getMinutes());
                next();
              }}
              contentStyle={{paddingVertical: 8}}
              style={{marginTop: 20, marginBottom: 12}}>
              Set Reminder →
            </Button>
            <Button mode="text" onPress={async () => {
              settings.update({nudgeEnabled: false});
              await cancelNudge();
              next();
            }}>
              Skip
            </Button>
          </View>
        );

      case 'battery':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              One more thing.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.primary, marginBottom: 20}}>
              This is the most important step. Skip it and your alarm might not go off.
            </Text>
            <Surface elevation={1} style={{borderRadius: 16, padding: 20, marginBottom: 24, gap: 16}}>
              <Text variant="titleMedium">Disable battery optimization for PushRise</Text>
              {[
                'Open your phone\'s Settings',
                'Go to Apps → PushRise',
                'Tap Battery',
                'Select "Unrestricted" or "Don\'t optimize"',
              ].map((step, i) => (
                <View key={i} style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: theme.colors.primary,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <Text variant="labelMedium" style={{color: theme.colors.onPrimary, fontWeight: '700'}}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, flex: 1}}>
                    {step}
                  </Text>
                </View>
              ))}
            </Surface>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Done →
            </Button>
          </View>
        );

      case 'paywall': {
        const weeklyPkg = offerings?.current?.availablePackages?.find((p: any) => p.packageType === Purchases.PACKAGE_TYPE.WEEKLY);
        const annualPkg = offerings?.current?.availablePackages?.find((p: any) => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
        const lifetimePkg = offerings?.current?.availablePackages?.find((p: any) => p.packageType === Purchases.PACKAGE_TYPE.LIFETIME);

        const PlanCard = ({type, title, price, subtext, badge}: any) => (
          <TouchableRipple onPress={() => setSelectedPkgType(type)} borderless style={{borderRadius: 16, marginBottom: 12}}>
            <Surface elevation={selectedPkgType === type ? 2 : 1} style={{
              borderRadius: 16, padding: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: selectedPkgType === type ? theme.colors.primary : theme.colors.surface,
              borderColor: selectedPkgType === type ? theme.colors.primary : theme.colors.outlineVariant,
              borderWidth: selectedPkgType === type ? 0 : 1,
            }}>
              <View>
                {badge && (
                  <Text variant="labelSmall" style={{color: selectedPkgType === type ? 'rgba(255,255,255,0.8)' : theme.colors.primary, letterSpacing: 0.5, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase'}}>
                    {badge}
                  </Text>
                )}
                <Text variant="titleLarge" style={{color: selectedPkgType === type ? '#fff' : theme.colors.onSurface, fontWeight: '700'}}>
                  {title}
                </Text>
                <Text variant="bodyMedium" style={{color: selectedPkgType === type ? 'rgba(255,255,255,0.8)' : theme.colors.onSurfaceVariant, marginTop: 2}}>
                  {price}
                </Text>
                {subtext && (
                  <Text variant="bodySmall" style={{color: selectedPkgType === type ? 'rgba(255,255,255,0.6)' : theme.colors.onSurfaceVariant, marginTop: 2}}>
                    {subtext}
                  </Text>
                )}
              </View>
              <Text variant="headlineSmall" style={{color: selectedPkgType === type ? '#fff' : theme.colors.onSurfaceVariant}}>
                →
              </Text>
            </Surface>
          </TouchableRipple>
        );

        return (
          <View style={{paddingHorizontal: 24, paddingTop: 24}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', lineHeight: 40, marginBottom: 12}}>
              Wake up a{'\n'}different person.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 8}}>
              You've tried willpower. You've tried reminders.
            </Text>
            <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, marginBottom: 28}}>
              Nothing stuck because nothing had real stakes. PushRise makes showing up non-negotiable. Every morning you get up builds who you are.
            </Text>

            <PlanCard
              type="weekly"
              title="Weekly"
              price={weeklyPkg?.product.priceString || '$3.95 / week'}
              subtext="Best for trying it out"
            />

            <PlanCard
              type="annual"
              title="Annual"
              price={annualPkg?.product.priceString || '$19.95 / year'}
              subtext="~$0.38/wk · Save 90%"
              badge="BEST VALUE"
            />

            <PlanCard
              type="lifetime"
              title="Lifetime"
              price={lifetimePkg?.product.priceString || '$39.95'}
              subtext="Own it forever"
            />

            {purchaseError && (
              <Text variant="bodySmall" style={{color: theme.colors.error, marginBottom: 12}}>
                {purchaseError}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handlePurchase}
              disabled={purchaseLoading || !offerings}
              contentStyle={{paddingVertical: 10}}
              style={{marginBottom: 12}}
            >
              {purchaseLoading ? '...' : 'Start My Free Trial →'}
            </Button>

            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 16}}>
              7-day free trial. No charge today.{'\n'}Cancel anytime.
            </Text>

            <Button
              mode="text"
              onPress={async () => {
                try {
                  await Purchases.restorePurchases();
                  await handleComplete();
                } catch {}
              }}
              contentStyle={{paddingVertical: 8}}
            >
              Restore purchases
            </Button>
          </View>
        );
      }

      default:
        return null;
    }
  };

  // ─── Shell ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ProgressBar progress={0.15 + (stepIdx / (STEPS.length - 1)) * 0.85} />
      <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12}}>
        {PHASES.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <Text style={{color: theme.colors.outline, marginHorizontal: 6, fontSize: 12}}>→</Text>
            )}
            <Text
              variant={phase === i ? 'labelLarge' : 'labelMedium'}
              style={{
                color: phase === i ? theme.colors.primary : theme.colors.outline,
                fontWeight: phase === i ? '700' : '400',
              }}>
              {label}
            </Text>
          </React.Fragment>
        ))}
      </View>

      {!HIDE_BACK.has(currentStep) && stepIdx > 0 && (
        <Button mode="text" onPress={back} style={{alignSelf: 'flex-start', marginLeft: 8}}>
          ← Back
        </Button>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1, paddingBottom: 48}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View style={{flex: 1, transform: [{translateX: slideX}]}}>
            {renderContent()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
