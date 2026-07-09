import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, StyleSheet, StatusBar, NativeModules} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {detectRepPhase, type RepPhase} from '../../utils/pushUpCounter';
import {useBankStore} from '../../store/bankStore';
import {DarkTheme} from '../../theme';

const {PoseDetection} = NativeModules;

// ponytail: always dark — camera overlay screen
const c = DarkTheme.colors;

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
        // frame failed — skip
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
          {debugAngle !== null && (
            <Text variant="labelSmall" style={{color: c.primary, opacity: 0.7, marginTop: 8}}>
              elbow: {debugAngle}°  phase: {phaseRef.current}
            </Text>
          )}
        </View>
        <Button
          mode="contained"
          onPress={done}
          contentStyle={{paddingHorizontal: 32, paddingVertical: 8}}>
          {count > 0 ? `Done  ·  +${count} banked` : 'Done'}
        </Button>
      </View>
    </View>
  );
}
