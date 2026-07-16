import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Dimensions, View, ScrollView, Animated, Vibration} from 'react-native';
import {
  Text, Button, Surface, Chip, TextInput,
  TouchableRipple, useTheme, ProgressBar,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useAlarmStore} from '../../store/alarmStore';
import {useOnboardingStore} from '../../store/onboardingStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {requestNotificationPermission, scheduleNudge, cancelNudge} from '../../utils/notifee';

const STEPS = [
  'welcome', 'name-input', 'founder', 'social',
  'quiz-intro', 'q1', 'q1-reflect', 'q2', 'q3', 'q4', 'q56',
  'analyzing', 'persona', 'outcome', 'summary',
  'create-alarm',
  'daily-goal', 'commitment', 'perm-warn', 'notif-perm', 'streak-reminder', 'battery', 'paywall', 'free-trial',
] as const;

type Step = typeof STEPS[number];

const HIDE_BACK = new Set<Step>(['welcome', 'analyzing', 'persona', 'notif-perm', 'paywall', 'free-trial']);
const PHASES = ['About You', 'Your Plan', 'Launch'] as const;

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
const TESTIMONIALS = [
  {stars: 5, text: '"Tried every alarm app. This is the only one I actually respect. It doesn\'t let me lie to myself."', name: 'Marcus, 22'},
  {stars: 5, text: '"Day 14. Never made it past day 3 with anything else. Push-ups at 6am. That\'s the point."', name: 'Jordan, 19'},
];

function getPersona(q1: number, q2: number): 'sleeper' | 'inconsistent' | 'optimizer' {
  if (q2 === 2 && q1 <= 1) return 'optimizer';
  if (q1 >= 2 && q2 === 0) return 'sleeper';
  return 'inconsistent';
}

const PERSONA_DATA = {
  sleeper: {
    title: '😴 The Sleeper',
    body: 'You know you should be doing more. PushRise was built for this. No more snooze.',
  },
  inconsistent: {
    title: '⚡ The Inconsistent',
    body: 'You\'ve got the drive — you just can\'t get started. Push-ups fix that.',
  },
  optimizer: {
    title: '🎯 The Optimizer',
    body: 'Already disciplined. PushRise gives you the system to make every rep count.',
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
  const [grindingFor, setGrindingFor] = useState('');
  const [commitSigned, setCommitSigned] = useState(false);
  const commitSealAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (currentStep !== 'q1') return;
    snoozeCountRef.current = 0;
    setSnoozeCount(0);
    const timer = setTimeout(() => {
      setQ1(Math.min(snoozeCountRef.current, 3));
      setStepIdx(s => Math.min(s + 1, STEPS.length - 1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 'analyzing') return;
    barAnims.forEach(a => a.setValue(0));
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
    startTrial();
    completeOnboarding();
  };

  const handleSnooze = () => {
    const newCount = snoozeCountRef.current + 1;
    snoozeCountRef.current = newCount;
    setSnoozeCount(newCount);
    if (newCount >= 3) {
      setQ1(3);
      next();
    }
  };

  const toggleRewardGoal = (i: number) =>
    setRewardGoals(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

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
              The snooze button{'\n'}is making you weak.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              Every snooze is practice for quitting.{'\n'}Start practicing the opposite.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              I'm ready →
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
              <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16}}>
                A note from the founder
              </Text>
              <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 28, fontStyle: 'italic'}}>
                {"Yo,\n\nI was you. Six alarms. Snoozed every one. I needed something that wouldn't let me off the hook — so I built it.\n\nNow I wake up knowing I already won.\n\nYou can too.\n— Syreese"}
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
                  <Text variant="labelMedium" style={{color: theme.colors.outline}}>{t.name}</Text>
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
              Let's be honest{'\n'}with each other.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              A few questions so we can build {name ? `${name}'s` : 'your'} plan.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Let's go →
            </Button>
          </View>
        );

      case 'q1':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 40, justifyContent: 'center', alignItems: 'center'}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', textAlign: 'center', marginBottom: 40}}>
              How bad is the snooze problem — really?
            </Text>
            <Text style={{fontSize: 88, textAlign: 'center', marginBottom: 16}}>🚨</Text>
            <Text variant="titleMedium" style={{color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 40}}>
              Your alarm is going off…
            </Text>
            {snoozeCount > 0 ? (
              <Text variant="titleLarge" style={{fontWeight: '700', color: theme.colors.primary, marginBottom: 32, textAlign: 'center'}}>
                {'😴'.repeat(Math.min(snoozeCount, 3))}{'  '}Snoozed {snoozeCount}×
              </Text>
            ) : (
              <Text variant="bodyMedium" style={{color: theme.colors.outline, marginBottom: 32}}>
                Tap snooze like you normally would
              </Text>
            )}
            <Button
              mode="contained"
              onPress={handleSnooze}
              contentStyle={{paddingVertical: 14, paddingHorizontal: 40}}>
              😴  Snooze
            </Button>
            <Text variant="bodySmall" style={{color: theme.colors.outline, marginTop: 36, textAlign: 'center'}}>
              Don't tap? We'll assume you wake up fine.
            </Text>
          </View>
        );

      case 'q1-reflect':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="displaySmall" style={{fontWeight: '800', lineHeight: 44, marginBottom: 16}}>
              {name ? `${name}, you're` : "You're"} not lazy.{'\n'}You're untrained.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 40}}>
              There's a difference — and it's fixable.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              I get it →
            </Button>
          </View>
        );

      case 'q2':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 20}}>
              How fit are you right now? Be real.
            </Text>
            {Q2_OPTIONS.map((opt, i) => (
              <Animated.View key={i} style={{opacity: q2Cards[i], transform: [{translateY: q2Cards[i].interpolate({inputRange: [0, 1], outputRange: [20, 0]})}]}}>
                <TouchableRipple onPress={() => { setQ2(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                  <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                    <Text variant="bodyLarge">{opt}</Text>
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
              Why did you really download this?
            </Text>
            {Q3_OPTIONS.map((opt, i) => (
              <Animated.View key={i} style={{opacity: q3Cards[i], transform: [{translateY: q3Cards[i].interpolate({inputRange: [0, 1], outputRange: [20, 0]})}]}}>
                <TouchableRipple onPress={() => { setQ3(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                  <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                    <Text variant="bodyLarge">{opt}</Text>
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
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 48}}>
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
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 64, justifyContent: 'center'}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 48}}>
              Building your plan…
            </Text>
            {statRows.map((row, i) => (
              analyzeLines > i ? (
                <View key={i} style={{marginBottom: 28}}>
                  <Text variant="labelSmall" style={{
                    color: theme.colors.onSurfaceVariant,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}>
                    {row.label}
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={{
                      width: 100, height: 8,
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: 4, overflow: 'hidden',
                    }}>
                      <Animated.View style={{
                        height: '100%',
                        backgroundColor: theme.colors.primary,
                        borderRadius: 4,
                        width: barAnims[i].interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}),
                      }} />
                    </View>
                    <Text variant="bodySmall" style={{color: theme.colors.onSurface, flex: 1}} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                </View>
              ) : null
            ))}
            {analyzeLines >= 3 && personaCharCount > 0 && (
              <Text variant="titleLarge" style={{
                fontWeight: '800',
                color: theme.colors.primary,
                marginTop: 28,
                letterSpacing: 0.5,
              }}>
                {personaTitle.slice(0, personaCharCount)}
              </Text>
            )}
            {analyzeComplete && (
              <Button mode="contained" onPress={next} style={{marginTop: 32}} contentStyle={{paddingVertical: 8}}>
                View Your Type →
              </Button>
            )}
          </View>
        );
      }

      case 'persona': {
        const p = PERSONA_DATA[persona];
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Surface elevation={2} style={{
              borderRadius: 20, padding: 28,
              borderWidth: 2, borderColor: theme.colors.primary,
              marginBottom: 32,
            }}>
              <Text variant="labelLarge" style={{color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8}}>
                {name ? `${name}'s type` : 'Your type'}
              </Text>
              <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 16}}>{p.title}</Text>
              <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26}}>{p.body}</Text>
            </Surface>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              That's me →
            </Button>
          </View>
        );
      }

      case 'outcome':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 20}}>
              In 30 days, you'll be a different person.
            </Text>
            <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20}}>
              Push-ups per week
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 160, marginBottom: 24}}>
              {CHART_HEIGHTS.map((h, i) => (
                <View key={i} style={{flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 8}}>
                  <Surface elevation={0} style={{
                    width: '100%',
                    height: h * 140,
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}>
                    <View style={{flex: 1, backgroundColor: theme.colors.primary, opacity: 0.85}} />
                  </Surface>
                  <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant}}>Wk {i + 1}</Text>
                </View>
              ))}
            </View>
            <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, lineHeight: 22, marginBottom: 32}}>
              People who hit 7 days don't quit. Day 1 is the hardest. After that, it's just who you are.
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
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 20}}>
              {name ? `Here's your plan, ${name}.` : "Here's your plan."}
            </Text>
            <Surface elevation={1} style={{borderRadius: 20, padding: 24, marginBottom: 24, gap: 20}}>
              {([
                ['⏰', 'Wake time', wakeTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})],
                ['💪', 'Starting reps', `${recommendedReps} push-ups`],
                ['🎯', 'Goal', goalLabel],
              ] as const).map(([icon, label, value]) => (
                <View key={label} style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                  <Text style={{fontSize: 28}}>{icon}</Text>
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
              In 7 days, this won't feel like a choice.{'\n'}It'll feel like who you are.
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
        const GOAL_PRESETS = [25, 50, 100, 200];
        const selectedGoal = parseInt(dailyGoalInput, 10);
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              Daily rep goal.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 28}}>
              How many reps per day?
            </Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
              {GOAL_PRESETS.map(n => (
                <TouchableRipple
                  key={n}
                  onPress={() => setDailyGoalInput(String(n))}
                  borderless
                  style={{flex: 1, borderRadius: 14}}>
                  <Surface
                    elevation={0}
                    style={{
                      borderRadius: 14, padding: 16, alignItems: 'center',
                      backgroundColor: selectedGoal === n ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    }}>
                    <Text style={{
                      fontSize: 22, fontWeight: '800',
                      color: selectedGoal === n ? theme.colors.primary : theme.colors.onSurface,
                    }}>{n}</Text>
                    <Text style={{fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2}}>reps</Text>
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
              Set My Goal →
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
          Animated.spring(commitSealAnim, {toValue: 1, useNativeDriver: true, tension: 55, friction: 6}).start();
          setTimeout(() => { settings.update({grindingFor: grindingFor.trim()}); next(); }, 900);
        };

        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Surface elevation={1} style={{
              borderRadius: 16, padding: 24, marginBottom: 20,
              borderWidth: 1, borderColor: theme.colors.outlineVariant,
            }}>
              <Text variant="labelLarge" style={{
                color: theme.colors.primary, letterSpacing: 2,
                textTransform: 'uppercase', marginBottom: 20,
              }}>
                Morning Contract
              </Text>

              <Text variant="bodyLarge" style={{lineHeight: 30, marginBottom: 16}}>
                {"I'll wake up at "}
                <Text style={{color: theme.colors.primary, fontWeight: '700'}}>{timeStr}</Text>
                {' and do '}
                <Text style={{color: theme.colors.primary, fontWeight: '700'}}>{recommendedReps} push-ups</Text>
                {'. My reason:'}
              </Text>

              <TextInput
                mode="outlined"
                value={grindingFor}
                onChangeText={setGrindingFor}
                placeholder="Write your reason here…"
                multiline
                numberOfLines={3}
                maxLength={120}
                editable={!commitSigned}
                style={{marginBottom: 24}}
              />

              <View style={{borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, paddingTop: 14}}>
                <Text style={{
                  fontFamily: 'serif', fontStyle: 'italic',
                  fontSize: 22, color: theme.colors.onSurface, textAlign: 'right',
                }}>
                  {'Signed: '}{name || '—'}
                </Text>
              </View>
            </Surface>

            {commitSigned && (
              <Animated.View style={{
                alignSelf: 'center', marginBottom: 20,
                opacity: commitSealAnim,
                transform: [{scale: commitSealAnim.interpolate({inputRange: [0, 1], outputRange: [0.2, 1]})}],
              }}>
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: theme.colors.primaryContainer,
                  borderWidth: 3, borderColor: theme.colors.primary,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Text style={{fontSize: 38, lineHeight: 46}}>✓</Text>
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
            <Text style={{fontSize: 13, fontWeight: '700', color: theme.colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12}}>
              Protect your streak
            </Text>
            <Text variant="headlineMedium" style={{fontWeight: '800', lineHeight: 38, marginBottom: 12}}>
              We'll remind you{'\n'}before midnight.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 36}}>
              Haven't logged reps yet? We'll ping you so your streak survives.
            </Text>

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

      case 'paywall':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 16}}>
            <TouchableRipple onPress={next} borderless style={{alignSelf: 'flex-end', borderRadius: 20, padding: 8, marginBottom: 8}}>
              <Text style={{fontSize: 22, color: theme.colors.onSurfaceVariant}}>✕</Text>
            </TouchableRipple>
            <Surface elevation={1} style={{borderRadius: 16, padding: 20, marginBottom: 28, gap: 10}}>
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                ☕  One coffee: $5–7. Lasts 20 minutes.
              </Text>
              <Text variant="bodyMedium" style={{color: theme.colors.primary}}>
                💪  PushRise: $2.99/month. Lasts forever.
              </Text>
            </Surface>

            <Text variant="headlineMedium" style={{fontWeight: '800', lineHeight: 40, marginBottom: 10}}>
              Start Free.{'\n'}Stay Because It Works.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 28}}>
              7 days. Full access. No credit card required.
            </Text>

            <TouchableRipple onPress={handleComplete} borderless style={{borderRadius: 16, marginBottom: 12}}>
              <Surface elevation={2} style={{
                borderRadius: 16, padding: 20,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: theme.colors.primary,
              }}>
                <View>
                  <Text variant="labelLarge" style={{color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4}}>
                    MOST POPULAR
                  </Text>
                  <Text variant="titleLarge" style={{color: '#fff', fontWeight: '700'}}>Monthly</Text>
                  <Text variant="bodyMedium" style={{color: 'rgba(255,255,255,0.8)', marginTop: 2}}>
                    $2.99 / month
                  </Text>
                </View>
                <Text variant="headlineSmall" style={{color: '#fff'}}>→</Text>
              </Surface>
            </TouchableRipple>

            <TouchableRipple onPress={handleComplete} borderless style={{borderRadius: 16, marginBottom: 20}}>
              <Surface elevation={1} style={{borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View>
                  <Text variant="titleLarge" style={{fontWeight: '700'}}>Lifetime</Text>
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, marginTop: 2}}>
                    $14.99 one-time
                  </Text>
                </View>
                <Text variant="headlineSmall" style={{color: theme.colors.onSurfaceVariant}}>→</Text>
              </Surface>
            </TouchableRipple>

            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 20}}>
              No charge today. No charge until Day 8.{'\n'}Cancel before then and pay nothing.
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'}}>
              {['Camera detection', 'Reward banking', 'Streak tracking', 'No ads'].map(t => (
                <Text key={t} variant="labelSmall" style={{color: theme.colors.onSurfaceVariant}}>✓ {t}</Text>
              ))}
            </View>
          </View>
        );

      case 'free-trial':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineLarge" style={{fontWeight: '800', marginBottom: 8}}>
              Try it free.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 32}}>
              7 days. No card needed.
            </Text>

            <View style={{gap: 16, marginBottom: 36}}>
              {[
                {icon: '📷', label: 'Camera counts your push-ups'},
                {icon: '💰', label: 'Earn rewards for reps'},
                {icon: '🔥', label: 'Track streaks'},
                {icon: '⏰', label: 'All alarm features'},
              ].map(({icon, label}) => (
                <View key={label} style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                  <Text style={{fontSize: 28}}>{icon}</Text>
                  <Text variant="bodyLarge" style={{color: theme.colors.onSurface}}>{label}</Text>
                </View>
              ))}
            </View>

            <Button mode="contained" onPress={handleComplete} contentStyle={{paddingVertical: 10}} style={{marginBottom: 12}}>
              Start Free Trial
            </Button>
            <Button mode="text" onPress={() => setStepIdx(s => s - 1)} style={{marginBottom: 8}}>
              See pricing
            </Button>
            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20}}>
              $2.99/mo after 7 days. Cancel anytime.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // ─── Shell ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ProgressBar progress={(phase + 1) / PHASES.length} />
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

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{flexGrow: 1, paddingBottom: 48}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{flex: 1, transform: [{translateX: slideX}]}}>
          {renderContent()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
