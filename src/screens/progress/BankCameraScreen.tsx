import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, StyleSheet, StatusBar, NativeModules, Vibration, Animated, Linking} from 'react-native';
import {Button, Text} from 'react-native-paper';
import Sound from 'react-native-sound';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';
import {useSettingsStore} from '../../store/settingsStore';
import {DarkTheme} from '../../theme';

const {PoseDetection} = NativeModules;

// ponytail: always dark — camera overlay screen
const c = DarkTheme.colors;

export default function BankCameraScreen() {
  const navigation = useNavigation();
  const {hapticOnRep, keepScreenOn, preferFrontCamera, audioCueOnRep, dailyGoal} = useSettingsStore();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice(preferFrontCamera ? 'front' : 'back');

  useEffect(() => { if (!hasPermission) requestPermission(); }, []);
  const {addReps, todayReps} = useBankStore();
  const cameraRef = useRef<Camera>(null);
  // #12 — white flash on each counted rep
  const flashOpacity = useRef(new Animated.Value(0)).current;
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
    if (keepScreenOn) {
      PoseDetection.keepScreenOn();
      return () => PoseDetection.allowScreenOff();
    }
  }, [keepScreenOn]);

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
            flashOpacity.setValue(0.55);
            Animated.timing(flashOpacity, {toValue: 0, duration: 220, useNativeDriver: true}).start();
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
  }, [hapticOnRep, audioCueOnRep]);

  const done = useCallback(() => {
    if (countRef.current > 0) addReps(countRef.current);
    navigation.goBack();
  }, [addReps, navigation]);

  if (!hasPermission) {
    return (
      <View style={{flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
        <StatusBar hidden />
        <Text variant="bodyLarge" style={{color: c.onSurfaceVariant, textAlign: 'center', marginBottom: 16}}>
          Camera access is required to count push-ups.
        </Text>
        <Button mode="contained" onPress={async () => {
          const granted = await requestPermission();
          if (!granted) Linking.openSettings();
        }} style={{marginBottom: 12}}>
          Grant Camera Access
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={{flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
        <StatusBar hidden />
        <Text variant="bodyLarge" style={{color: c.onSurfaceVariant, marginBottom: 32}}>
          Camera not available
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      <StatusBar hidden />
      <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive photo />
      <Button
        mode="text"
        textColor="rgba(255,255,255,0.7)"
        onPress={() => navigation.goBack()}
        style={{position: 'absolute', top: 40, left: 8, zIndex: 10}}>
        ← Cancel
      </Button>
      <View style={{
        ...StyleSheet.absoluteFill,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 64,
      }}>
        <View style={{alignItems: 'center'}}>
          <Text style={{fontSize: 128, fontWeight: '700', color: c.primary, lineHeight: 128}}>
            {count}
          </Text>
          <Text variant="titleLarge" style={{color: '#fff', letterSpacing: 1, marginTop: -4}}>
            push-ups
          </Text>
          {__DEV__ && debugAngle !== null && (
            <Text variant="labelSmall" style={{color: c.primary, opacity: 0.7, marginTop: 8}}>
              elbow: {debugAngle}°  phase: {phaseRef.current}
            </Text>
          )}
        </View>
        {dailyGoal > 0 && (
          <Text variant="labelLarge" style={{color: 'rgba(255,255,255,0.55)', marginBottom: 16}}>
            {todayReps + count >= dailyGoal
              ? "Today's goal hit! 🎉"
              : `Today: ${todayReps + count} / ${dailyGoal}`}
          </Text>
        )}
        <Button
          mode="contained"
          onPress={done}
          contentStyle={{paddingHorizontal: 32, paddingVertical: 8}}>
          {count > 0 ? `Done  ·  +${count} banked` : 'Done'}
        </Button>
      </View>
      {/* #12 — rep flash overlay */}
      <Animated.View pointerEvents="none" style={{...StyleSheet.absoluteFill, backgroundColor: '#fff', opacity: flashOpacity}} />
    </View>
  );
}
