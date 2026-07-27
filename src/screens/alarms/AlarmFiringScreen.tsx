import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Vibration, StatusBar, Alert, NativeModules, Animated} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import {Button, Text, useTheme} from 'react-native-paper';
import Sound from 'react-native-sound';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../navigation/navigationRef';
import InAppReview from 'react-native-in-app-review';
import {cancelAlarm, dismissFiredAlarm, scheduleAlarm, scheduleRivalNotif, scheduleSnoozeAlarm} from '../../utils/notifee';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';
import RepSlotsModal from '../../components/RepSlotsModal';
import {useAlarmStore} from '../../store/alarmStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useOnboardingStore} from '../../store/onboardingStore';

type Route = RouteProp<RootStackParamList, 'AlarmFiring'>;
const {PoseDetection} = NativeModules;

Sound.setCategory('Alarm');

function ManualCounter({
  reps, onDone, onSkip, hapticOnRep, audioCueOnRep, dailyGoal, todayReps,
}: {reps: number; onDone: () => void; onSkip: () => void; hapticOnRep: boolean; audioCueOnRep: boolean; dailyGoal: number; todayReps: number}) {
  const {colors} = useTheme();
  const [count, setCount] = useState(0);
  const beepRef = useRef<Sound | null>(null);
  const btnScale = useRef(new Animated.Value(1)).current;
  const pressBtnIn = () => Animated.spring(btnScale, {toValue: 0.93, useNativeDriver: true}).start();
  const pressBtnOut = () => Animated.spring(btnScale, {toValue: 1, useNativeDriver: true}).start();

  useEffect(() => {
    // ponytail: needs beep.mp3 in android/app/src/main/res/raw/
    const beep = new Sound('beep.mp3', Sound.MAIN_BUNDLE, () => {});
    beepRef.current = beep;
    return () => beep.release();
  }, []);

  const tap = () => {
    if (hapticOnRep) Vibration.vibrate(40);
    if (audioCueOnRep) { beepRef.current?.stop(); beepRef.current?.play(); }
    setCount(n => {
      const next = n + 1;
      if (next >= reps) onDone();
      return next;
    });
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24}}>
      <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>Tap once per push-up</Text>
      <Animated.View style={{transform: [{scale: btnScale}]}}>
        <Button
          mode="contained"
          onPress={tap}
          onPressIn={pressBtnIn}
          onPressOut={pressBtnOut}
          contentStyle={{width: 180, height: 180, borderRadius: 90}}
          style={{borderRadius: 90}}
          labelStyle={{fontSize: 24, fontWeight: '900'}}>
          {count} / {reps}
        </Button>
      </Animated.View>
      <Button mode="text" textColor={colors.onSurfaceVariant} onPress={onSkip}>
        Skip (no push-ups)
      </Button>
      {dailyGoal > 0 && (
        <Text variant="labelSmall" style={{color: colors.onSurfaceVariant, opacity: 0.7}}>
          {todayReps + count >= dailyGoal
            ? "Today's goal hit! 🎉"
            : `Today: ${todayReps + count} / ${dailyGoal}`}
        </Text>
      )}
    </View>
  );
}

function CameraCounter({
  reps, onDone, onSkip, hapticOnRep, preferFrontCamera, audioCueOnRep, dailyGoal, todayReps,
}: {reps: number; onDone: () => void; onSkip: () => void; hapticOnRep: boolean; preferFrontCamera: boolean; audioCueOnRep: boolean; dailyGoal: number; todayReps: number}) {
  const {colors} = useTheme();
  const device = useCameraDevice(preferFrontCamera ? 'front' : 'back');
  const cameraRef = useRef<Camera>(null);
  const phaseRef = useRef<RepPhase>('up');
  const pendingPhaseRef = useRef<RepPhase>('up');
  const pendingCountRef = useRef(0);
  const countRef = useRef(0);
  const processingRef = useRef(false);
  const [count, setCount] = useState(0);
  const [debugAngle, setDebugAngle] = useState<number | null>(null);
  const beepRef = useRef<Sound | null>(null);

  useEffect(() => {
    // ponytail: needs beep.mp3 in android/app/src/main/res/raw/
    const beep = new Sound('beep.mp3', Sound.MAIN_BUNDLE, () => {});
    beepRef.current = beep;
    return () => beep.release();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (processingRef.current || !cameraRef.current) return;
      processingRef.current = true;
      try {
        const snapshot = await cameraRef.current.takeSnapshot({quality: 60, skipMetadata: true});
        const landmarks = await PoseDetection.detectFromFile(snapshot.path);
        const {phase: newPhase, angle} = detectRepPhase(landmarks, phaseRef.current);
        if (__DEV__) setDebugAngle(Math.round(angle));
        if (newPhase === pendingPhaseRef.current) {
          pendingCountRef.current += 1;
        } else {
          pendingPhaseRef.current = newPhase;
          pendingCountRef.current = 1;
        }
        if (pendingCountRef.current >= 2 && newPhase !== phaseRef.current) {
          if (phaseRef.current === 'down' && newPhase === 'up') {
            countRef.current += 1;
            setCount(countRef.current);
            if (hapticOnRep) Vibration.vibrate(40);
            if (audioCueOnRep) { beepRef.current?.stop(); beepRef.current?.play(); }
            if (countRef.current >= reps) onDone();
          }
          phaseRef.current = newPhase;
        }
      } catch {
        // frame failed — skip
      } finally {
        processingRef.current = false;
      }
    }, 200);
    return () => clearInterval(interval);
  }, [reps, onDone, hapticOnRep, audioCueOnRep]);

  if (!device) return <ManualCounter reps={reps} onDone={onDone} onSkip={onSkip} hapticOnRep={hapticOnRep} audioCueOnRep={audioCueOnRep} dailyGoal={dailyGoal} todayReps={todayReps} />;

  return (
    <View style={{flex: 1, width: '100%', alignItems: 'center'}}>
      <Camera ref={cameraRef} style={{width: '100%', flex: 1, borderRadius: 16, overflow: 'hidden'}} device={device} isActive photo />
      <View style={{position: 'absolute', bottom: 80, alignItems: 'center'}}>
        <Text style={{fontSize: 96, fontWeight: '700', color: colors.primary, lineHeight: 96}}>
          {count}
        </Text>
        <Text variant="titleLarge" style={{color: colors.onSurface, marginTop: -8}}>
          / {reps} push-ups
        </Text>
        {__DEV__ && debugAngle !== null && (
          <Text variant="labelSmall" style={{color: colors.primary, marginTop: 4, opacity: 0.8}}>
            elbow angle: {debugAngle}°  phase: {phaseRef.current}
          </Text>
        )}
        {dailyGoal > 0 && (
          <Text variant="labelSmall" style={{color: colors.onSurfaceVariant, marginTop: 6, opacity: 0.8}}>
            {todayReps + count >= dailyGoal
              ? "Today's goal hit! 🎉"
              : `Today: ${todayReps + count} / ${dailyGoal}`}
          </Text>
        )}
      </View>
      <Button mode="text" textColor={colors.onSurfaceVariant} onPress={onSkip} style={{position: 'absolute', bottom: 24}}>
        Skip (no push-ups)
      </Button>
    </View>
  );
}

export default function AlarmFiringScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {colors: c} = useTheme();
  const {alarmId, reps, sound, volume, snoozeCount = 0} = route.params;
  const {addReps, spendReps, totalReps, currentStreak, todayReps} = useBankStore();
  const alarm = useAlarmStore(s => s.alarms.find(a => a.id === alarmId));
  const {
    vibrateOnAlarm, muteAudioDuringPushups,
    hapticOnRep, keepScreenOn, preferFrontCamera,
    autoCompleteAlarm, audioCueOnRep, dailyGoal,
    emergencyBypassEnabled, emergencyBypassCost,
  } = useSettingsStore();
  const {hasPromptedReview, markReviewPrompted} = useOnboardingStore();

  const [mode, setMode] = useState<'idle' | 'camera' | 'manual' | 'done'>('idle');
  const [showSlots, setShowSlots] = useState(false);
  const slotPayoutRef = useRef<number | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const confettiRef = useRef<any>(null);
  // #8 — press-in scale for primary action buttons
  const btnScale = useRef(new Animated.Value(1)).current;
  const pressBtnIn = () => Animated.spring(btnScale, {toValue: 0.95, useNativeDriver: true}).start();
  const pressBtnOut = () => Animated.spring(btnScale, {toValue: 1, useNativeDriver: true}).start();

  useEffect(() => {
    if (vibrateOnAlarm) Vibration.vibrate([0, 500, 300, 500], true);
    const s = new Sound(sound ?? 'alarm.mp3', Sound.MAIN_BUNDLE, err => {
      if (!err) {
        s.setVolume(volume ?? 1.0);
        s.setNumberOfLoops(-1);
        s.play();
      }
    });
    soundRef.current = s;
    return () => {
      Vibration.cancel();
      s.stop();
      s.release();
    };
  }, [sound, volume, vibrateOnAlarm]);

  useEffect(() => {
    if (keepScreenOn) {
      PoseDetection.keepScreenOn();
      return () => PoseDetection.allowScreenOff();
    }
  }, [keepScreenOn]);

  // Mute alarm sound when camera/manual counting starts
  useEffect(() => {
    if (muteAudioDuringPushups && mode !== 'idle' && mode !== 'done') {
      soundRef.current?.setVolume(0);
    } else if (mode === 'idle') {
      soundRef.current?.setVolume(volume ?? 1.0);
    }
  }, [mode, muteAudioDuringPushups, volume]);

  const cleanup = useCallback(async (completed: boolean) => {
    Vibration.cancel();
    soundRef.current?.stop();
    if (alarm && alarm.days.length > 0 && alarm.enabled) {
      await scheduleAlarm({...alarm, volume: alarm.volume ?? 1.0, sound: alarm.sound ?? 'alarm.mp3'});
      await dismissFiredAlarm(alarmId);
    } else {
      await cancelAlarm(alarmId);
    }
    if (completed) {
      const earned = slotPayoutRef.current !== null ? slotPayoutRef.current : reps;
      if (earned > 0) addReps(earned);
      scheduleRivalNotif(totalReps + (earned > 0 ? earned : 0));
      if (!hasPromptedReview && InAppReview.isAvailable()) {
        markReviewPrompted();
        InAppReview.RequestInAppReview();
      }
    }
    navigation.goBack();
  }, [alarm, alarmId, reps, addReps, totalReps, navigation, hasPromptedReview, markReviewPrompted]);

  const complete = useCallback(() => {
    Vibration.cancel();
    soundRef.current?.stop();
    setMode('done');
  }, []);

  useEffect(() => {
    if (mode !== 'done' || !autoCompleteAlarm) return;
    const t = setTimeout(() => cleanup(true), 800);
    return () => clearTimeout(t);
  }, [mode, autoCompleteAlarm, cleanup]);

  useEffect(() => {
    if (mode === 'done') confettiRef.current?.start();
  }, [mode]);

  const dismiss = useCallback(() => cleanup(false), [cleanup]);

  const handleSnooze = useCallback(async (minutes: number) => {
    Vibration.cancel();
    soundRef.current?.stop();
    await scheduleSnoozeAlarm(alarmId, reps + minutes, sound ?? 'alarm.mp3', volume ?? 1.0, snoozeCount + 1, minutes);
    navigation.goBack();
  }, [alarmId, reps, snoozeCount, sound, volume, navigation]);

  const handleEmergencyBypass = () => {
    Alert.alert(
      'Emergency Skip',
      `Use ${emergencyBypassCost} banked reps to skip this alarm? Your streak won't count for today.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Skip', style: 'destructive', onPress: () => { spendReps(emergencyBypassCost); cleanup(false); }},
      ],
    );
  };

  const startCamera = async () => {
    const permission = await Camera.requestCameraPermission();
    if (permission === 'granted') {
      setMode('camera');
    } else {
      Alert.alert(
        'Camera needed',
        'Grant camera access to use push-up detection, or use manual mode.',
        [{text: 'Manual mode', onPress: () => setMode('manual')}],
      );
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: c.background, alignItems: 'center', paddingTop: 80, paddingHorizontal: 24}}>
      <StatusBar hidden />
      <Text style={{fontSize: 64, fontWeight: '200', color: c.onBackground, letterSpacing: -2}}>
        {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
      </Text>
      <Text variant="titleMedium" style={{color: c.onSurfaceVariant, marginTop: -4, marginBottom: 32}}>
        Time to wake up.
      </Text>

      {mode === 'idle' && (
        <View style={{alignItems: 'center', flex: 1, justifyContent: 'center', gap: 16}}>
          <>
              <Text style={{fontSize: 96, fontWeight: '700', color: c.primary, lineHeight: 96}}>
                {reps}
              </Text>
              <Text variant="titleMedium" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
                push-ups to silence this alarm
              </Text>
              <Animated.View style={{transform: [{scale: btnScale}]}}>
                <Button mode="contained" onPress={startCamera} onPressIn={pressBtnIn} onPressOut={pressBtnOut} contentStyle={{paddingHorizontal: 32, paddingVertical: 8}}>
                  I'm Ready
                </Button>
              </Animated.View>
              <Button mode="text" textColor={c.onSurfaceVariant} onPress={() => setMode('manual')}>
                Use manual count instead
              </Button>
            </>
          {alarm?.snoozeEnabled && snoozeCount < 3 && (
            <View style={{alignItems: 'center', gap: 6}}>
              <Text variant="labelSmall" style={{color: c.onSurfaceVariant, opacity: 0.7}}>
                Snooze ({3 - snoozeCount} left) — adds reps
              </Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                {[5, 10, 15].map(min => (
                  <Button key={min} mode="outlined" compact onPress={() => handleSnooze(min)}>
                    {min}m +{min}
                  </Button>
                ))}
              </View>
            </View>
          )}
          {emergencyBypassEnabled && totalReps >= emergencyBypassCost && (
            <Button mode="text" textColor={c.error} onPress={handleEmergencyBypass}>
              Emergency Skip (-{emergencyBypassCost} reps)
            </Button>
          )}
          <Button mode="text" textColor={c.outline} onPress={dismiss}>
            Skip (no push-ups)
          </Button>
        </View>
      )}

      {mode === 'camera' && (
        <CameraCounter
          reps={reps}
          onDone={complete}
          onSkip={dismiss}
          hapticOnRep={hapticOnRep}
          preferFrontCamera={preferFrontCamera}
          audioCueOnRep={audioCueOnRep}
          dailyGoal={dailyGoal}
          todayReps={todayReps}
        />
      )}
      {mode === 'manual' && (
        <ManualCounter
          reps={reps}
          onDone={complete}
          onSkip={dismiss}
          hapticOnRep={hapticOnRep}
          audioCueOnRep={audioCueOnRep}
          dailyGoal={dailyGoal}
          todayReps={todayReps}
        />
      )}

      {mode === 'done' && (
        <View style={{alignItems: 'center', flex: 1, justifyContent: 'center', gap: 12}}>
          <Text style={{fontSize: 64}}>💪</Text>
          <Text variant="displaySmall" style={{color: c.primary, fontWeight: '900', textAlign: 'center', letterSpacing: -1}}>
            {reps} reps
          </Text>
          <Text variant="titleLarge" style={{color: c.onSurfaceVariant, textAlign: 'center'}}>
            banked. You won this morning.
          </Text>
          {currentStreak > 1 && (
            <Text variant="titleMedium" style={{color: c.primary, textAlign: 'center'}}>
              Day {currentStreak} in a row 🔥
            </Text>
          )}
          {currentStreak === 1 && (
            <Text variant="titleMedium" style={{color: c.primary, textAlign: 'center'}}>
              Streak started! 🔥
            </Text>
          )}
          <Animated.View style={{marginTop: 16, transform: [{scale: btnScale}]}}>
            <Button
              mode="contained"
              onPress={() => cleanup(true)}
              onPressIn={pressBtnIn}
              onPressOut={pressBtnOut}
              contentStyle={{paddingHorizontal: 40, paddingVertical: 10}}>
              Dismiss Alarm
            </Button>
          </Animated.View>
          {!autoCompleteAlarm && slotPayoutRef.current === null && (
            <Button mode="outlined" onPress={() => setShowSlots(true)} style={{marginTop: 8}}>
              🎰 Try Your Luck — wager {reps} reps
            </Button>
          )}
        </View>
      )}
      <ConfettiCannon ref={confettiRef} count={80} origin={{x: 200, y: 0}} autoStart={false} fadeOut />

      <RepSlotsModal
        visible={showSlots}
        wager={reps}
        onResult={payout => { slotPayoutRef.current = payout; }}
        onClose={() => setShowSlots(false)}
      />
    </View>
  );
}
