import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Vibration, StatusBar, Alert, NativeModules} from 'react-native';
import Sound from 'react-native-sound';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../navigation/navigationRef';
import {cancelAlarm, dismissFiredAlarm, scheduleAlarm} from '../../utils/notifee';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';
import {useAlarmStore} from '../../store/alarmStore';

type Route = RouteProp<RootStackParamList, 'AlarmFiring'>;
const {PoseDetection} = NativeModules;

Sound.setCategory('Alarm');

function ManualCounter({reps, onDone, onSkip}: {reps: number; onDone: () => void; onSkip: () => void}) {
  const [count, setCount] = useState(0);
  useEffect(() => { if (count >= reps) onDone(); }, [count, reps, onDone]);
  return (
    <View style={styles.manualArea}>
      <Text style={styles.manualHint}>Tap once per push-up</Text>
      <TouchableOpacity style={styles.repBtn} onPress={() => setCount(c => c + 1)} activeOpacity={0.7}>
        <Text style={styles.repBtnTxt}>{count} / {reps}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipTxt}>Skip (no push-ups)</Text>
      </TouchableOpacity>
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
        // frame failed — skip it
      } finally {
        processingRef.current = false;
      }
    }, 200);
    return () => clearInterval(interval);
  }, [reps, onDone]);

  if (!device) return <ManualCounter reps={reps} onDone={onDone} onSkip={onSkip} />;

  return (
    <View style={styles.cameraArea}>
      <Camera ref={cameraRef} style={styles.camera} device={device} isActive photo />
      <View style={styles.cameraOverlay}>
        <Text style={styles.countNum}>{count}</Text>
        <Text style={styles.countOf}>/ {reps} push-ups</Text>
        {debugAngle !== null && (
          <Text style={styles.debugAngle}>elbow angle: {debugAngle}°  phase: {phaseRef.current}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipTxt}>Skip (no push-ups)</Text>
      </TouchableOpacity>
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
      // Recurring: schedule next occurrence, then only dismiss tray notification.
      // cancelAlarm would kill the newly-scheduled trigger, so we use dismissFiredAlarm.
      await scheduleAlarm({
        ...alarm,
        volume: alarm.volume ?? 1.0,
        sound: alarm.sound ?? 'alarm.mp3',
      });
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
    <View style={styles.container}>
      <StatusBar hidden />
      <Text style={styles.time}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
      <Text style={styles.label}>Time to wake up.</Text>

      {mode === 'idle' && (
        <View style={styles.idleArea}>
          <Text style={styles.repsNeeded}>{reps}</Text>
          <Text style={styles.repsSubtitle}>push-ups to silence this alarm</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startCamera}>
            <Text style={styles.startTxt}>I'm Ready</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('manual')} style={styles.manualLink}>
            <Text style={styles.manualLinkTxt}>Use manual count instead</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>Skip (no push-ups)</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'camera' && <CameraCounter reps={reps} onDone={complete} onSkip={dismiss} />}
      {mode === 'manual' && <ManualCounter reps={reps} onDone={complete} onSkip={dismiss} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', paddingTop: 80, paddingHorizontal: 24},
  time: {fontSize: 64, fontWeight: '200', color: '#fff', letterSpacing: -2},
  label: {fontSize: 18, color: '#555', marginTop: -8, marginBottom: 32},
  idleArea: {alignItems: 'center', flex: 1, justifyContent: 'center', gap: 12},
  repsNeeded: {fontSize: 96, fontWeight: '700', color: '#FF6B00', lineHeight: 96},
  repsSubtitle: {fontSize: 16, color: '#555', marginBottom: 24},
  startBtn: {backgroundColor: '#FF6B00', paddingHorizontal: 48, paddingVertical: 18, borderRadius: 40},
  startTxt: {fontSize: 20, fontWeight: '700', color: '#fff'},
  manualLink: {paddingVertical: 8},
  manualLinkTxt: {fontSize: 14, color: '#444'},
  manualArea: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24},
  manualHint: {fontSize: 14, color: '#555'},
  repBtn: {width: 180, height: 180, borderRadius: 90, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center', elevation: 8},
  repBtnTxt: {fontSize: 24, fontWeight: '900', color: '#fff'},
  cameraArea: {flex: 1, width: '100%', alignItems: 'center'},
  camera: {width: '100%', flex: 1, borderRadius: 16, overflow: 'hidden'},
  cameraOverlay: {position: 'absolute', bottom: 80, alignItems: 'center'},
  countNum: {fontSize: 96, fontWeight: '700', color: '#FF6B00', lineHeight: 96},
  countOf: {fontSize: 18, color: '#fff', marginTop: -8},
  skipBtn: {paddingVertical: 16},
  skipTxt: {fontSize: 14, color: '#333'},
  debugAngle: {fontSize: 12, color: '#FF6B00', marginTop: 4, opacity: 0.8},
});
