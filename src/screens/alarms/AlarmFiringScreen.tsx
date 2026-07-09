import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Vibration, StatusBar, Alert, NativeModules} from 'react-native';
import {Button, Text} from 'react-native-paper';
import Sound from 'react-native-sound';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../navigation/navigationRef';
import {cancelAlarm, dismissFiredAlarm, scheduleAlarm} from '../../utils/notifee';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';
import {useAlarmStore} from '../../store/alarmStore';
import {DarkTheme} from '../../theme';

type Route = RouteProp<RootStackParamList, 'AlarmFiring'>;
const {PoseDetection} = NativeModules;

// ponytail: always dark regardless of user theme — alarm fires in the dark
const c = DarkTheme.colors;

Sound.setCategory('Alarm');

function ManualCounter({reps, onDone, onSkip}: {reps: number; onDone: () => void; onSkip: () => void}) {
  const [count, setCount] = useState(0);
  useEffect(() => { if (count >= reps) onDone(); }, [count, reps, onDone]);
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24}}>
      <Text variant="bodyMedium" style={{color: c.onSurfaceVariant}}>Tap once per push-up</Text>
      <Button
        mode="contained"
        onPress={() => setCount(n => n + 1)}
        contentStyle={{width: 180, height: 180, borderRadius: 90}}
        style={{borderRadius: 90}}
        labelStyle={{fontSize: 24, fontWeight: '900'}}>
        {count} / {reps}
      </Button>
      <Button mode="text" textColor={c.onSurfaceVariant} onPress={onSkip}>
        Skip (no push-ups)
      </Button>
    </View>
  );
}

function CameraCounter({reps, onDone, onSkip}: {reps: number; onDone: () => void; onSkip: () => void}) {
  const device = useCameraDevice('front');
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
  }, [reps, onDone]);

  if (!device) return <ManualCounter reps={reps} onDone={onDone} onSkip={onSkip} />;

  return (
    <View style={{flex: 1, width: '100%', alignItems: 'center'}}>
      <Camera ref={cameraRef} style={{width: '100%', flex: 1, borderRadius: 16, overflow: 'hidden'}} device={device} isActive photo />
      <View style={{position: 'absolute', bottom: 80, alignItems: 'center'}}>
        <Text style={{fontSize: 96, fontWeight: '700', color: c.primary, lineHeight: 96}}>
          {count}
        </Text>
        <Text variant="titleLarge" style={{color: '#fff', marginTop: -8}}>
          / {reps} push-ups
        </Text>
        {debugAngle !== null && (
          <Text variant="labelSmall" style={{color: c.primary, marginTop: 4, opacity: 0.8}}>
            elbow angle: {debugAngle}°  phase: {phaseRef.current}
          </Text>
        )}
      </View>
      <Button mode="text" textColor={c.onSurfaceVariant} onPress={onSkip} style={{position: 'absolute', bottom: 24}}>
        Skip (no push-ups)
      </Button>
    </View>
  );
}

export default function AlarmFiringScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const {alarmId, reps, sound, volume} = route.params;
  const {addReps} = useBankStore();
  const alarm = useAlarmStore(s => s.alarms.find(a => a.id === alarmId));
  const [mode, setMode] = useState<'idle' | 'camera' | 'manual'>('idle');
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    Vibration.vibrate([0, 500, 300, 500], true);
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
  }, [sound, volume]);

  const cleanup = useCallback(async (completed: boolean) => {
    Vibration.cancel();
    soundRef.current?.stop();
    if (alarm && alarm.days.length > 0 && alarm.enabled) {
      await scheduleAlarm({...alarm, volume: alarm.volume ?? 1.0, sound: alarm.sound ?? 'alarm.mp3'});
      await dismissFiredAlarm(alarmId);
    } else {
      await cancelAlarm(alarmId);
    }
    if (completed) addReps(reps);
    navigation.goBack();
  }, [alarm, alarmId, reps, addReps, navigation]);

  const complete = useCallback(() => cleanup(true), [cleanup]);
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
          <Button mode="text" textColor={c.outline} onPress={dismiss}>
            Skip (no push-ups)
          </Button>
        </View>
      )}

      {mode === 'camera' && <CameraCounter reps={reps} onDone={complete} onSkip={dismiss} />}
      {mode === 'manual' && <ManualCounter reps={reps} onDone={complete} onSkip={dismiss} />}
    </View>
  );
}
