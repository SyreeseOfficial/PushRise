import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Animated, StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useAlarmStore} from '../../store/alarmStore';
import {useOnboardingStore} from '../../store/onboardingStore';
import {requestNotificationPermission} from '../../utils/notifee';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  'welcome', 'founder', 'social',
  'quiz-intro', 'q1', 'q1-reflect', 'q2', 'q3', 'q4', 'q56',
  'analyzing', 'persona', 'outcome', 'summary',
  'create-alarm',
  'commitment', 'perm-warn', 'notif-perm', 'battery', 'paywall',
] as const;

type Step = typeof STEPS[number];

const HIDE_BACK = new Set<Step>(['welcome', 'analyzing', 'persona', 'notif-perm', 'paywall']);

const Q1_OPTIONS = [
  'I wake up fine most days',
  'I hit snooze once or twice',
  'I hit snooze until I\'m almost late',
  'I\'ve actually been late because of it',
];
const Q2_OPTIONS = ['I never really work out', 'I work out here and there', 'I\'m pretty consistent'];
const Q3_OPTIONS = ['I just need to wake up on time', 'I want to get stronger', 'I need a complete reset — both'];
const Q4_OPTIONS = ['5 or fewer', 'Around 10', '15–20', 'More than 20'];
const Q4_REPS = [5, 10, 15, 20];
const REWARD_GOALS = [
  'More time before my day starts',
  'A stronger body',
  'Actually hitting my goals',
  'Feeling proud of myself',
  'Just not being late anymore',
];
const ANALYZE_TEXTS = [
  'Analyzing your wake-up patterns…',
  'Calculating your push-up baseline…',
  'Designing your reward system…',
  'Building your personalized plan…',
];
const TESTIMONIALS = [
  {stars: 5, text: '"I\'ve tried every alarm app. This is the only one I actually respect. It doesn\'t let me lie to myself."', name: 'Marcus, 22'},
  {stars: 5, text: '"Day 14. Never made it past day 3 with anything else. The push-ups are brutal at 6am — that\'s the point."', name: 'Jordan, 19'},
  {stars: 5, text: '"My roommate started using it after he saw me wake up on time for two weeks straight. Now we compete."', name: 'Tyler, 24'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPersona(q1: number, q2: number): 'sleeper' | 'inconsistent' | 'optimizer' {
  if (q2 === 2 && q1 <= 1) return 'optimizer';
  if (q1 >= 2 && q2 === 0) return 'sleeper';
  return 'inconsistent';
}

const PERSONA_DATA = {
  sleeper: {
    title: 'The Sleeper',
    body: 'You know you should be doing more. You\'re tired of feeling behind before the day starts. PushRise was literally built for you — the people who need this most are the ones who keep hitting snooze. That stops today.',
  },
  inconsistent: {
    title: 'The Inconsistent',
    body: 'You have the drive — you just can\'t get it started in the morning. Your push-ups are going to fix that. Every morning you do them is a morning you win before the day begins.',
  },
  optimizer: {
    title: 'The Optimizer',
    body: 'You\'re already disciplined. PushRise gives you a system to turn that discipline into real results. Track everything. Bank every rep. Earn what you spend.',
  },
};

const CHART_HEIGHTS = [0.15, 0.38, 0.62, 0.9];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const {addAlarm} = useAlarmStore();
  const {completeOnboarding} = useOnboardingStore();

  // Step
  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = STEPS[stepIdx] as Step;
  const progress = stepIdx / (STEPS.length - 1);

  // Quiz answers (-1 = unanswered)
  const [q1, setQ1] = useState(-1);
  const [q2, setQ2] = useState(-1);
  const [q3, setQ3] = useState(-1);
  const [q4, setQ4] = useState(-1);
  const [rewardGoals, setRewardGoals] = useState<number[]>([]);

  // Wake/alarm time
  const [wakeTime, setWakeTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(7, 0, 0, 0); return d;
  });
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [alarmTime, setAlarmTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(7, 0, 0, 0); return d;
  });
  const [showAlarmPicker, setShowAlarmPicker] = useState(false);
  const [alarmReps, setAlarmReps] = useState('10');

  // Analyzing animation
  const analyzeProgress = useRef(new Animated.Value(0)).current;
  const [analyzeIdx, setAnalyzeIdx] = useState(0);

  const persona = useMemo(() => getPersona(q1, q2), [q1, q2]);
  const recommendedReps = Q4_REPS[Math.max(0, q4)] ?? 10;

  // Navigation
  const next = () => setStepIdx(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    // Skip back over auto-advance screens
    if (currentStep === 'outcome' || currentStep === 'summary') {
      setStepIdx(s => s - 2); // skip persona or outcome
    } else {
      setStepIdx(s => Math.max(s - 1, 0));
    }
  };

  // Sync alarm settings when reaching create-alarm
  useEffect(() => {
    if (currentStep === 'create-alarm') {
      setAlarmTime(wakeTime);
      setAlarmReps(String(recommendedReps));
    }
  }, [currentStep]);

  // Analyzing auto-advance
  useEffect(() => {
    if (currentStep !== 'analyzing') return;
    analyzeProgress.setValue(0);
    setAnalyzeIdx(0);
    const anim = Animated.timing(analyzeProgress, {
      toValue: 1, duration: 3600, useNativeDriver: false,
    });
    anim.start(({finished}) => { if (finished) setStepIdx(s => s + 1); });
    const ticker = setInterval(() => setAnalyzeIdx(i => (i + 1) % ANALYZE_TEXTS.length), 900);
    return () => { anim.stop(); clearInterval(ticker); };
  }, [currentStep]);

  const handleComplete = async () => {
    await addAlarm({
      hour: alarmTime.getHours(),
      minute: alarmTime.getMinutes(),
      reps: parseInt(alarmReps, 10) || 10,
      label: '',
      days: [],
      volume: 1.0,
      sound: 'alarm.mp3',
    });
    completeOnboarding();
  };

  const toggleRewardGoal = (i: number) =>
    setRewardGoals(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  // ─── Step content ────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (currentStep) {

      case 'welcome':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.appName}>PushRise</Text>
            <Text style={styles.heroHeading}>The snooze button{'\n'}is making you weak.</Text>
            <Text style={styles.heroSub}>
              Every morning you give in, you train yourself to quit.{'\n'}It's time to train yourself to win.
            </Text>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>I'm ready to change →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'founder':
        return (
          <View style={styles.content}>
            <View style={styles.founderCard}>
              <Text style={styles.founderHeading}>A note from the founder</Text>
              <Text style={styles.founderBody}>
                {"Hey,\n\nI built PushRise because I was you.\n\nSix alarms. Snoozed every single one. Then spent the rest of the day feeling behind before it even started.\n\nThe problem wasn't my alarm. It was me.\n\nI needed something that wouldn't let me off the hook. So I built it.\n\nNow I wake up every morning knowing I already won.\n\nYou can too.\n\n— Syreese"}
              </Text>
            </View>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>Let's do this →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'social':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>Real people. Real results.</Text>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <Text style={styles.stars}>{'★'.repeat(t.stars)}</Text>
                <Text style={styles.testimonialTxt}>{t.text}</Text>
                <Text style={styles.testimonialName}>— {t.name}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>Continue →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'quiz-intro':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.heroHeading}>Let's be honest{'\n'}with each other.</Text>
            <Text style={styles.heroSub}>A few questions so we can build your plan.</Text>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>Let's go →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'q1':
        return (
          <View style={styles.content}>
            <Text style={styles.quizQ}>How bad is the snooze problem — really?</Text>
            {Q1_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.answerCard} onPress={() => { setQ1(i); next(); }}>
                <Text style={styles.answerTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'q1-reflect':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.reflectHeading}>You're not lazy.{'\n'}You're untrained.</Text>
            <Text style={styles.heroSub}>There's a difference — and it's fixable.</Text>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>I get it →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'q2':
        return (
          <View style={styles.content}>
            <Text style={styles.quizQ}>What does your body look like right now? Be honest.</Text>
            {Q2_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.answerCard} onPress={() => { setQ2(i); next(); }}>
                <Text style={styles.answerTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'q3':
        return (
          <View style={styles.content}>
            <Text style={styles.quizQ}>Why did you really download this?</Text>
            {Q3_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.answerCard} onPress={() => { setQ3(i); next(); }}>
                <Text style={styles.answerTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'q4':
        return (
          <View style={styles.content}>
            <Text style={styles.quizQ}>No ego. How many push-ups can you actually do right now?</Text>
            {Q4_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.answerCard} onPress={() => { setQ4(i); next(); }}>
                <Text style={styles.answerTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'q56':
        return (
          <View style={styles.content}>
            <Text style={styles.quizQ}>When do you need to wake up?</Text>
            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowWakePicker(true)}>
              <Text style={styles.timePickerTxt}>
                {wakeTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </Text>
              <Text style={styles.timePickerHint}>tap to change</Text>
            </TouchableOpacity>
            {showWakePicker && (
              <DateTimePicker
                value={wakeTime}
                mode="time"
                display="default"
                onChange={(e, d) => { setShowWakePicker(false); if (e.type !== 'dismissed' && d) setWakeTime(d); }}
              />
            )}

            <Text style={[styles.quizQ, {marginTop: 32}]}>What would make waking up worth it?</Text>
            {REWARD_GOALS.map((g, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.answerCard, rewardGoals.includes(i) && styles.answerCardActive]}
                onPress={() => toggleRewardGoal(i)}>
                <Text style={[styles.answerTxt, rewardGoals.includes(i) && styles.answerTxtActive]}>
                  {rewardGoals.includes(i) ? '✓ ' : ''}{g}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.cta, {marginTop: 24}]} onPress={next}>
              <Text style={styles.ctaTxt}>Continue →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'analyzing':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.sectionHeading}>Building your plan…</Text>
            <View style={styles.analyzeTrack}>
              <Animated.View style={[styles.analyzeFill, {
                width: analyzeProgress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}),
              }]} />
            </View>
            <Text style={styles.analyzeSubtxt}>{ANALYZE_TEXTS[analyzeIdx]}</Text>
          </View>
        );

      case 'persona': {
        const p = PERSONA_DATA[persona];
        return (
          <View style={styles.centerContent}>
            <View style={styles.personaCard}>
              <Text style={styles.personaLabel}>Your type</Text>
              <Text style={styles.personaTitle}>{p.title}</Text>
              <Text style={styles.personaBody}>{p.body}</Text>
            </View>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>That's me →</Text>
            </TouchableOpacity>
          </View>
        );
      }

      case 'outcome':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>In 30 days, you'll be a different person.</Text>
            <Text style={styles.outcomeSub}>Push-ups per week</Text>
            <View style={styles.chart}>
              {CHART_HEIGHTS.map((h, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={[styles.chartBar, {height: h * 140}]} />
                  <Text style={styles.chartLabel}>Wk {i + 1}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.outcomeCaption}>
              Users who complete 7 days don't quit. The first morning is the hardest. After that, it becomes who you are.
            </Text>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>I want that →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'summary': {
        const goalLabel = Q3_OPTIONS[Math.max(0, q3)] ?? 'Get better';
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>Here's your plan.</Text>
            <View style={styles.summaryCard}>
              {[
                ['⏰', 'Wake time', wakeTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})],
                ['💪', 'Starting reps', `${recommendedReps} push-ups`],
                ['🎯', 'Goal', goalLabel],
              ].map(([icon, label, value]) => (
                <View key={label} style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>{icon}</Text>
                  <View style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.summaryFooter}>
              In 7 days, this won't feel like a choice.{'\n'}It'll feel like who you are.
            </Text>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>Set Your First Alarm →</Text>
            </TouchableOpacity>
          </View>
        );
      }

      case 'create-alarm':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>Set it. Don't overthink.</Text>
            <Text style={styles.heroSub}>Pick a time you actually need to wake up.</Text>

            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowAlarmPicker(true)}>
              <Text style={styles.timePickerTxt}>
                {alarmTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </Text>
              <Text style={styles.timePickerHint}>tap to change</Text>
            </TouchableOpacity>
            {showAlarmPicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={(e, d) => { setShowAlarmPicker(false); if (e.type !== 'dismissed' && d) setAlarmTime(d); }}
              />
            )}

            <Text style={styles.fieldLabel}>Push-ups to dismiss</Text>
            <TextInput
              style={styles.repsInput}
              value={alarmReps}
              onChangeText={setAlarmReps}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />

            <TouchableOpacity style={[styles.cta, {marginTop: 32}]} onPress={next}>
              <Text style={styles.ctaTxt}>Set My Alarm →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'commitment':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>Before we go any further.</Text>
            <Text style={styles.heroSub}>How committed are you to actually doing this?</Text>
            {[
              'Fully committed. No more excuses.',
              "I'm ready to try",
              "I'm still figuring it out",
            ].map(opt => (
              <TouchableOpacity key={opt} style={styles.answerCard} onPress={next}>
                <Text style={styles.answerTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'perm-warn':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>Before we finish setup…</Text>
            <Text style={styles.heroSub}>We need a couple permissions to make sure your alarm never fails.</Text>
            {[
              {icon: '🔋', title: 'Battery access', sub: 'So your alarm fires even when your phone tries to save power'},
              {icon: '🔔', title: 'Notifications', sub: "So we warn you before your trial ends"},
            ].map(p => (
              <View key={p.title} style={styles.permCard}>
                <Text style={styles.permIcon}>{p.icon}</Text>
                <View style={styles.permText}>
                  <Text style={styles.permTitle}>{p.title}</Text>
                  <Text style={styles.permSub}>{p.sub}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>Got it →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'notif-perm':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.sectionHeading}>Allow notifications</Text>
            <Text style={styles.heroSub}>We'll only send alarm alerts and trial reminders. Nothing else.</Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={async () => { await requestNotificationPermission(); next(); }}>
              <Text style={styles.ctaTxt}>Grant Access →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipLink} onPress={next}>
              <Text style={styles.skipLinkTxt}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 'battery':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionHeading}>One more thing.</Text>
            <Text style={[styles.heroSub, {color: '#FF6B00'}]}>
              This is the most important step. Skip it and your alarm might not go off.
            </Text>
            <View style={styles.batteryCard}>
              <Text style={styles.batteryTitle}>Disable battery optimization for PushRise</Text>
              {[
                'Open your phone\'s Settings',
                'Go to Apps → PushRise',
                'Tap Battery',
                'Select "Unrestricted" or "Don\'t optimize"',
              ].map((step, i) => (
                <View key={i} style={styles.batteryStep}>
                  <View style={styles.batteryNum}>
                    <Text style={styles.batteryNumTxt}>{i + 1}</Text>
                  </View>
                  <Text style={styles.batteryStepTxt}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.cta} onPress={next}>
              <Text style={styles.ctaTxt}>Done →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'paywall':
        return (
          <View style={styles.content}>
            <View style={styles.priceCompare}>
              <Text style={styles.priceCompareRow}>☕  One coffee: $5–7. Lasts 20 minutes.</Text>
              <Text style={[styles.priceCompareRow, {color: '#FF6B00'}]}>
                💪  PushRise: $2.99/month. Lasts forever.
              </Text>
            </View>

            <Text style={styles.paywallHeading}>Start Free.{'\n'}Stay Because It Works.</Text>
            <Text style={styles.paywallSub}>7 days. Full access. No credit card required.</Text>

            <TouchableOpacity style={styles.planCardPrimary} onPress={handleComplete}>
              <View>
                <Text style={styles.planBadge}>MOST POPULAR</Text>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>$2.99 / month</Text>
              </View>
              <Text style={styles.planArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.planCardAlt} onPress={handleComplete}>
              <View>
                <Text style={styles.planName}>Lifetime</Text>
                <Text style={styles.planPrice}>$14.99 one-time</Text>
              </View>
              <Text style={styles.planArrow}>→</Text>
            </TouchableOpacity>

            <Text style={styles.paywallFooter}>
              No charge today. No charge until Day 8.{'\n'}Cancel before then and pay nothing.
            </Text>

            <View style={styles.trustRow}>
              {['Camera detection', 'Reward banking', 'Streak tracking', 'No ads'].map(t => (
                <Text key={t} style={styles.trustItem}>✓ {t}</Text>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // ─── Shell ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {width: `${progress * 100}%`}]} />
      </View>

      {!HIDE_BACK.has(currentStep) && stepIdx > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={back}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  progressTrack: {height: 2, backgroundColor: '#1a1a1a'},
  progressFill: {height: 2, backgroundColor: '#FF6B00'},
  backBtn: {paddingHorizontal: 20, paddingVertical: 12},
  backTxt: {fontSize: 22, color: '#555'},
  scroll: {flex: 1},
  scrollContent: {flexGrow: 1, paddingBottom: 48},

  // Layouts
  content: {paddingHorizontal: 24, paddingTop: 32},
  centerContent: {flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'},

  // Typography
  appName: {fontSize: 15, fontWeight: '700', color: '#FF6B00', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32},
  heroHeading: {fontSize: 36, fontWeight: '800', color: '#fff', lineHeight: 44, letterSpacing: -0.5, marginBottom: 16},
  heroSub: {fontSize: 17, color: '#666', lineHeight: 26, marginBottom: 40},
  sectionHeading: {fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 36, letterSpacing: -0.5, marginBottom: 20},
  quizQ: {fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 30, marginBottom: 20},
  fieldLabel: {fontSize: 13, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 24},

  // CTA
  cta: {backgroundColor: '#FF6B00', borderRadius: 40, paddingVertical: 18, alignItems: 'center'},
  ctaTxt: {fontSize: 17, fontWeight: '700', color: '#fff'},
  skipLink: {alignItems: 'center', paddingVertical: 16},
  skipLinkTxt: {fontSize: 14, color: '#444'},

  // Answer cards
  answerCard: {
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#1e1e1e',
    borderRadius: 14, padding: 18, marginBottom: 10,
  },
  answerCardActive: {borderColor: '#FF6B00', backgroundColor: '#1a0d00'},
  answerTxt: {fontSize: 16, color: '#aaa', fontWeight: '500'},
  answerTxtActive: {color: '#FF6B00'},

  // Founder note
  founderCard: {
    backgroundColor: '#111', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 24,
  },
  founderHeading: {fontSize: 13, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16},
  founderBody: {fontSize: 16, color: '#999', lineHeight: 28, fontStyle: 'italic'},

  // Testimonials
  testimonialCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 12,
  },
  stars: {color: '#FF6B00', fontSize: 14, marginBottom: 10},
  testimonialTxt: {fontSize: 15, color: '#888', lineHeight: 24, fontStyle: 'italic', marginBottom: 10},
  testimonialName: {fontSize: 13, color: '#555'},

  // Time picker
  timePickerBtn: {alignItems: 'center', paddingVertical: 20, marginBottom: 8},
  timePickerTxt: {fontSize: 64, fontWeight: '200', color: '#fff', letterSpacing: -2},
  timePickerHint: {fontSize: 13, color: '#444', marginTop: 4},

  // Reflection
  reflectHeading: {fontSize: 36, fontWeight: '800', color: '#fff', lineHeight: 44, letterSpacing: -0.5, marginBottom: 16},

  // Analyzing
  analyzeTrack: {width: '100%', height: 3, backgroundColor: '#1a1a1a', borderRadius: 2, marginVertical: 32},
  analyzeFill: {height: 3, backgroundColor: '#FF6B00', borderRadius: 2},
  analyzeSubtxt: {fontSize: 15, color: '#555', textAlign: 'center'},

  // Persona
  personaCard: {
    backgroundColor: '#141414', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: '#FF6B00', marginBottom: 32,
  },
  personaLabel: {fontSize: 12, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8},
  personaTitle: {fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 16},
  personaBody: {fontSize: 16, color: '#888', lineHeight: 26},

  // Dream outcome chart
  outcomeSub: {fontSize: 13, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20},
  chart: {flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 160, marginBottom: 24},
  chartCol: {flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 8},
  chartBar: {width: '100%', backgroundColor: '#FF6B00', borderRadius: 6, opacity: 0.85},
  chartLabel: {fontSize: 12, color: '#555'},
  outcomeCaption: {fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 32},

  // Journey summary
  summaryCard: {
    backgroundColor: '#141414', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 24, gap: 20,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'center', gap: 16},
  summaryIcon: {fontSize: 28},
  summaryText: {flex: 1},
  summaryLabel: {fontSize: 12, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5},
  summaryValue: {fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 2},
  summaryFooter: {fontSize: 16, color: '#555', lineHeight: 26, textAlign: 'center', marginBottom: 32},

  // Create alarm
  repsInput: {fontSize: 56, fontWeight: '300', color: '#FF6B00', borderBottomWidth: 1, borderBottomColor: '#333', width: 120},

  // Permissions
  permCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    backgroundColor: '#141414', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 12,
  },
  permIcon: {fontSize: 28},
  permText: {flex: 1},
  permTitle: {fontSize: 16, fontWeight: '600', color: '#fff'},
  permSub: {fontSize: 13, color: '#555', marginTop: 4, lineHeight: 20},

  // Battery optimization
  batteryCard: {
    backgroundColor: '#141414', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 24, gap: 16,
  },
  batteryTitle: {fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4},
  batteryStep: {flexDirection: 'row', alignItems: 'center', gap: 14},
  batteryNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF6B00',
    justifyContent: 'center', alignItems: 'center',
  },
  batteryNumTxt: {fontSize: 13, fontWeight: '700', color: '#fff'},
  batteryStepTxt: {fontSize: 15, color: '#888', flex: 1},

  // Paywall
  priceCompare: {
    backgroundColor: '#111', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 28, gap: 10,
  },
  priceCompareRow: {fontSize: 15, color: '#666', lineHeight: 22},
  paywallHeading: {fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 40, letterSpacing: -0.5, marginBottom: 10},
  paywallSub: {fontSize: 16, color: '#666', marginBottom: 28},
  planCardPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FF6B00', borderRadius: 16, padding: 20, marginBottom: 12,
  },
  planCardAlt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#141414', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 20,
  },
  planBadge: {fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4},
  planName: {fontSize: 18, fontWeight: '700', color: '#fff'},
  planPrice: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  planArrow: {fontSize: 22, color: '#fff'},
  paywallFooter: {fontSize: 13, color: '#444', textAlign: 'center', lineHeight: 20, marginBottom: 20},
  trustRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'},
  trustItem: {fontSize: 12, color: '#555'},
});
