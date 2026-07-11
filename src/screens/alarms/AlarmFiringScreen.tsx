import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Vibration, StatusBar, Alert, NativeModules} from 'react-native';
import {Button, Text, useTheme} from 'react-native-paper';
import Sound from 'react-native-sound';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../navigation/navigationRef';
import InAppReview from 'react-native-in-app-review';
import {cancelAlarm, dismissFiredAlarm, scheduleAlarm, scheduleRivalNotif} from '../../utils/notifee';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';
import {useAlarmStore} from '../../store/alarmStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useSubscriptionStore, isTrialExpired} from '../../store/subscriptionStore';
import {useOnboardingStore} from '../../store/onboardingStore';
import Ringer from '../../components/Ringer';

type Route = RouteProp<RootStackParamList, 'AlarmFiring'>;
const {PoseDetection} = NativeModules;

Sound.setCategory('Alarm');

function ManualCounter({
  reps, onDone, onSkip, hapticOnRep,
}: {reps: number; onDone: () => void; onSkip: () => void; hapticOnRep: boolean}) {
  const {colors} = useTheme();
  const [count, setCount] = useState(0);

  const tap = () => {
    if (hapticOnRep) Vibration.vibrate(40);
    setCount(n => {
      const next = n + 1;
      if (next >= reps) onDone();
      return next;
    });
  };

  const getRingerState = () => {
    if (count === 0) return 'point-at-you';
    if (count === reps - 1) return 'hype';
    return 'arms-crossed';
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24}}>
      <Ringer state={getRingerState()} size="medium" />
      <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>Tap once per push-up</Text>
      <Button
        mode="contained"
        onPress={tap}
        contentStyle={{width: 180, height: 180, borderRadius: 90}}
        style={{borderRadius: 90}}
        labelStyle={{fontSize: 24, fontWeight: '900'}}>
        {count} / {reps}
      </Button>
      <Button mode="text" textColor={colors.onSurfaceVariant} onPress={onSkip}>
        Skip (no push-ups)
      </Button>
    </View>
  );
}

function CameraCounter({
  reps, onDone, onSkip, hapticOnRep, preferFrontCamera,
}: {reps: number; onDone: () => void; onSkip: () => void; hapticOnRep: boolean; preferFrontCamera: boolean}) {
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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (processingRef.current || !cameraRef.current) return;
      processingRef.current = true;
      try {
        const snapshot = await cameraRef.current.takeSnapshot({quality: 60, skipMetadata: true});
        const landmarks = await PoseDetection.detectFromFile(snapshot.path);
        const {phase: newPhase, angle} = detectRepPhase(landmarks, phaseRef.current);
        setDebugAngle(Math.round(angle));
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
  }, [reps, onDone, hapticOnRep]);

  if (!device) return <ManualCounter reps={reps} onDone={onDone} onSkip={onSkip} hapticOnRep={hapticOnRep} />;

  const getRingerState = () => count >= reps * 0.75 ? 'tired' : 'aggressive';

  return (
    <View style={{flex: 1, width: '100%', alignItems: 'center'}}>
      <Camera ref={cameraRef} style={{width: '100%', flex: 1, borderRadius: 16, overflow: 'hidden'}} device={device} isActive photo />
      <View style={{position: 'absolute', top: 40, left: 24}}>
        <Ringer state={getRingerState()} size="medium" />
      </View>
      <View style={{position: 'absolute', bottom: 80, alignItems: 'center'}}>
        <Text style={{fontSize: 96, fontWeight: '700', color: colors.primary, lineHeight: 96}}>
          {count}
        </Text>
        <Text variant="titleLarge" style={{color: colors.onSurface, marginTop: -8}}>
          / {reps} push-ups
        </Text>
        {debugAngle !== null && (
          <Text variant="labelSmall" style={{color: colors.primary, marginTop: 4, opacity: 0.8}}>
            elbow angle: {debugAngle}°  phase: {phaseRef.current}
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
  const {alarmId, reps, sound, volume} = route.params;
  const {addReps, totalReps} = useBankStore();
  const alarm = useAlarmStore(s => s.alarms.find(a => a.id === alarmId));
  const {
    vibrateOnAlarm, muteAudioDuringPushups, autoCompleteAlarm,
    hapticOnRep, keepScreenOn, preferFrontCamera,
  } = useSettingsStore();
  const {trialStartedAt, isSubscribed} = useSubscriptionStore();
  const isLocked = !isSubscribed && isTrialExpired(trialStartedAt);
  const {hasPromptedReview, markReviewPrompted} = useOnboardingStore();

  const [mode, setMode] = useState<'idle' | 'camera' | 'manual' | 'done'>('idle');
  const soundRef = useRef<Sound | null>(null);

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
      addReps(reps);
      scheduleRivalNotif(totalReps + reps);
      if (!hasPromptedReview && InAppReview.isAvailable()) {
        markReviewPrompted();
        InAppReview.RequestInAppReview();
      }
    }
    navigation.goBack();
  }, [alarm, alarmId, reps, addReps, totalReps, navigation, hasPromptedReview, markReviewPrompted]);

  const complete = useCallback(() => {
    if (autoCompleteAlarm) {
      cleanup(true);
    } else {
      Vibration.cancel();
      soundRef.current?.stop();
      setMode('done');
    }
  }, [autoCompleteAlarm, cleanup]);

  const dismiss = useCallback(() => cleanup(false), [cleanup]);

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
          {isLocked ? (
            <>
              <Ringer state="disappointed" size="medium" style={{marginBottom: 8}} />
              <Text variant="bodyMedium" style={{color: c.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 16}}>
                Your trial has ended. Upgrade to dismiss alarms with push-ups.
              </Text>
              <Button mode="contained" onPress={() => navigation.navigate('Paywall')} contentStyle={{paddingHorizontal: 32, paddingVertical: 8}}>
                Upgrade Now
              </Button>
            </>
          ) : (
            <>
              <Ringer state="cocky" size="large" />
              <Text style={{fontSize: 96, fontWeight: '700', color: c.primary, lineHeight: 96}}>
                {reps}
              </Text>
              <Text variant="titleMedium" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
                push-ups to silence this alarm
              </Text>
              <Button mode="contained" onPress={startCamera} contentStyle={{paddingHorizontal: 32, paddingVertical: 8}}>
                I'm Ready
              </Button>
              <Button mode="text" textColor={c.onSurfaceVariant} onPress={() => setMode('manual')}>
                Use manual count instead
              </Button>
            </>
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
        />
      )}
      {mode === 'manual' && (
        <ManualCounter
          reps={reps}
          onDone={complete}
          onSkip={dismiss}
          hapticOnRep={hapticOnRep}
        />
      )}

      {mode === 'done' && (
        <View style={{alignItems: 'center', flex: 1, justifyContent: 'center', gap: 20}}>
          <Ringer state="celebrating" size="large" />
          <Text variant="headlineMedium" style={{color: c.primary, fontWeight: '800', textAlign: 'center'}}>
            Done! {reps} reps banked.
          </Text>
          <Button
            mode="contained"
            onPress={() => cleanup(true)}
            contentStyle={{paddingHorizontal: 40, paddingVertical: 10}}>
            Dismiss Alarm
          </Button>
        </View>
      )}
    </View>
  );
}
