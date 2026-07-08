import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar, NativeModules} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';

const {PoseDetection} = NativeModules;

export default function BankCameraScreen() {
  const navigation = useNavigation();
  const device = useCameraDevice('front');
  const {addReps} = useBankStore();
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
  }, []);

  const done = useCallback(() => {
    if (countRef.current > 0) addReps(countRef.current);
    navigation.goBack();
  }, [addReps, navigation]);

  if (!device) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar hidden />
        <Text style={styles.errorTxt}>Camera not available</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneBtn}>
          <Text style={styles.doneTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive photo />
      <View style={styles.overlay}>
        <View style={styles.countBox}>
          <Text style={styles.countNum}>{count}</Text>
          <Text style={styles.countLabel}>push-ups</Text>
          {debugAngle !== null && (
            <Text style={styles.debugAngle}>elbow: {debugAngle}°  phase: {phaseRef.current}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={done} activeOpacity={0.85}>
          <Text style={styles.doneTxt}>
            {count > 0 ? `Done  ·  +${count} banked` : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  centered: {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 64,
  },
  countBox: {alignItems: 'center'},
  countNum: {fontSize: 128, fontWeight: '700', color: '#FF6B00', lineHeight: 128},
  countLabel: {fontSize: 20, color: '#fff', letterSpacing: 1, marginTop: -4},
  debugAngle: {fontSize: 12, color: '#FF6B00', opacity: 0.7, marginTop: 8},
  doneBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 40,
    elevation: 6,
  },
  doneTxt: {fontSize: 18, fontWeight: '700', color: '#fff'},
  errorTxt: {fontSize: 16, color: '#555', marginBottom: 32},
});
