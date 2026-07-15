import React, {useState, useEffect, useRef, useMemo} from 'react';
import {View, ScrollView, Animated} from 'react-native';
import {
  Text, Button, Surface, Chip, TextInput,
  ProgressBar, TouchableRipple, useTheme,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useAlarmStore} from '../../store/alarmStore';
import {useOnboardingStore} from '../../store/onboardingStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {requestNotificationPermission, scheduleNudge, cancelNudge} from '../../utils/notifee';

const STEPS = [
  'welcome', 'founder', 'social',
  'quiz-intro', 'q1', 'q1-reflect', 'q2', 'q3', 'q4', 'q56',
  'analyzing', 'persona', 'outcome', 'summary',
  'create-alarm',
  'daily-goal', 'commitment', 'perm-warn', 'notif-perm', 'streak-reminder', 'battery', 'paywall',
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

export default function OnboardingScreen() {
  const theme = useTheme();
  const {addAlarm} = useAlarmStore();
  const {completeOnboarding} = useOnboardingStore();
  const {startTrial} = useSubscriptionStore();
  const settings = useSettingsStore();

  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = STEPS[stepIdx] as Step;
  const progress = stepIdx / (STEPS.length - 1);

  const [q1, setQ1] = useState(-1);
  const [q2, setQ2] = useState(-1);
  const [q3, setQ3] = useState(-1);
  const [q4, setQ4] = useState(-1);
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

  const analyzeProgress = useRef(new Animated.Value(0)).current;
  const [analyzeProgress2, setAnalyzeProgress2] = useState(0);
  const [analyzeIdx, setAnalyzeIdx] = useState(0);

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
    if (currentStep !== 'analyzing') return;
    analyzeProgress.setValue(0);
    setAnalyzeProgress2(0);
    setAnalyzeIdx(0);
    const listener = analyzeProgress.addListener(({value}) => setAnalyzeProgress2(value));
    const anim = Animated.timing(analyzeProgress, {
      toValue: 1, duration: 3600, useNativeDriver: false,
    });
    anim.start(({finished}) => { if (finished) setStepIdx(s => s + 1); });
    const ticker = setInterval(() => setAnalyzeIdx(i => (i + 1) % ANALYZE_TEXTS.length), 900);
    return () => {
      anim.stop();
      clearInterval(ticker);
      analyzeProgress.removeListener(listener);
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

  const toggleRewardGoal = (i: number) =>
    setRewardGoals(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  // ─── Step renders ─────────────────────────────────────────────────────────────

  const renderContent = () => {
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
              Every morning you give in, you train yourself to quit.{'\n'}It's time to train yourself to win.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              I'm ready to change →
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
                {"Hey,\n\nI built PushRise because I was you.\n\nSix alarms. Snoozed every single one. Then spent the rest of the day feeling behind before it even started.\n\nThe problem wasn't my alarm. It was me.\n\nI needed something that wouldn't let me off the hook. So I built it.\n\nNow I wake up every morning knowing I already won.\n\nYou can too.\n\n— Syreese"}
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
              <Surface key={i} elevation={1} style={{borderRadius: 16, padding: 20, marginBottom: 12}}>
                <Text style={{color: theme.colors.primary, fontSize: 14, marginBottom: 10}}>
                  {'★'.repeat(t.stars)}
                </Text>
                <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, lineHeight: 24, fontStyle: 'italic', marginBottom: 10}}>
                  {t.text}
                </Text>
                <Text variant="labelMedium" style={{color: theme.colors.outline}}>— {t.name}</Text>
              </Surface>
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
              A few questions so we can build your plan.
            </Text>
            <Button mode="contained" onPress={next} contentStyle={{paddingVertical: 8}}>
              Let's go →
            </Button>
          </View>
        );

      case 'q1':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 20}}>
              How bad is the snooze problem — really?
            </Text>
            {Q1_OPTIONS.map((opt, i) => (
              <TouchableRipple key={i} onPress={() => { setQ1(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                  <Text variant="bodyLarge" style={{color: theme.colors.onSurface}}>{opt}</Text>
                </Surface>
              </TouchableRipple>
            ))}
          </View>
        );

      case 'q1-reflect':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="displaySmall" style={{fontWeight: '800', lineHeight: 44, marginBottom: 16}}>
              You're not lazy.{'\n'}You're untrained.
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
              What does your body look like right now? Be honest.
            </Text>
            {Q2_OPTIONS.map((opt, i) => (
              <TouchableRipple key={i} onPress={() => { setQ2(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                  <Text variant="bodyLarge">{opt}</Text>
                </Surface>
              </TouchableRipple>
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
              <TouchableRipple key={i} onPress={() => { setQ3(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                  <Text variant="bodyLarge">{opt}</Text>
                </Surface>
              </TouchableRipple>
            ))}
          </View>
        );

      case 'q4':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineSmall" style={{fontWeight: '700', lineHeight: 30, marginBottom: 20}}>
              No ego. How many push-ups can you actually do right now?
            </Text>
            {Q4_OPTIONS.map((opt, i) => (
              <TouchableRipple key={i} onPress={() => { setQ4(i); next(); }} borderless style={{borderRadius: 14, marginBottom: 10}}>
                <Surface elevation={1} style={{borderRadius: 14, padding: 18}}>
                  <Text variant="bodyLarge">{opt}</Text>
                </Surface>
              </TouchableRipple>
            ))}
          </View>
        );

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

      case 'analyzing':
        return (
          <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 48, justifyContent: 'center'}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 32}}>
              Building your plan…
            </Text>
            <ProgressBar progress={analyzeProgress2} color={theme.colors.primary} style={{height: 4, borderRadius: 2}} />
            <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 20}}>
              {ANALYZE_TEXTS[analyzeIdx]}
            </Text>
          </View>
        );

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
                Your type
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
              Users who complete 7 days don't quit. The first morning is the hardest. After that, it becomes who you are.
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
              Here's your plan.
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
              Set a daily rep goal.
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 28}}>
              How many push-ups do you want to do every day?
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
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              What are you grinding for?
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 8}}>
              Be specific. Vague goals don't stick.
            </Text>
            <Text variant="bodySmall" style={{color: theme.colors.outline, marginBottom: 24}}>
              e.g. "Wake up before 7am every day" or "Get stronger before summer"
            </Text>
            <TextInput
              mode="outlined"
              value={grindingFor}
              onChangeText={setGrindingFor}
              placeholder="I'm grinding for…"
              multiline
              numberOfLines={3}
              maxLength={120}
              style={{marginBottom: 28}}
            />
            <Button
              mode="contained"
              disabled={!canContinue}
              onPress={() => { settings.update({grindingFor: grindingFor.trim()}); next(); }}
              contentStyle={{paddingVertical: 8}}
              style={{marginBottom: 12}}>
              Lock it in →
            </Button>
            <Button mode="text" onPress={next}>Skip</Button>
          </View>
        );
      }

      case 'perm-warn':
        return (
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
            <Text variant="headlineMedium" style={{fontWeight: '800', marginBottom: 8}}>
              Before we finish setup…
            </Text>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 24}}>
              We need a couple permissions to make sure your alarm never fails.
            </Text>
            {[
              {icon: '🔋', title: 'Battery access', sub: 'So your alarm fires even when your phone tries to save power'},
              {icon: '🔔', title: 'Notifications', sub: "So we warn you before your trial ends"},
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
              If you haven't logged any push-ups, we'll send a reminder so your streak doesn't die quietly.
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
          <View style={{paddingHorizontal: 24, paddingTop: 32}}>
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

            <Text variant="bodySmall" style={{color: theme.colors.outline, textAlign: 'center', lineHeight: 20, marginBottom: 20}}>
              No charge today. No charge until Day 8.{'\n'}Cancel before then and pay nothing.
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'}}>
              {['Camera detection', 'Reward banking', 'Streak tracking', 'No ads'].map(t => (
                <Text key={t} variant="labelSmall" style={{color: theme.colors.outline}}>✓ {t}</Text>
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
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ProgressBar
        progress={progress}
        color={theme.colors.primary}
        style={{height: 3}}
      />

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
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
