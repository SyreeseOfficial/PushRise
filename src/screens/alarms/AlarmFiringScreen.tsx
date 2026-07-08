import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  StatusBar,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../navigation/navigationRef';
import {cancelAlarm} from '../../utils/notifee';

type Route = RouteProp<RootStackParamList, 'AlarmFiring'>;

// ponytail: manual mode only for Week 1 — camera detection added next sprint
export default function AlarmFiringScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const {alarmId, reps} = route.params;

  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'idle' | 'counting'>('idle');
  // Looping vibration until dismissed
  useEffect(() => {
    Vibration.vibrate([0, 500, 300, 500], true);
    return () => Vibration.cancel();
  }, []);

  const dismiss = async () => {
    Vibration.cancel();
    await cancelAlarm(alarmId);
    navigation.goBack();
  };

  // Auto-dismiss when count reaches target
  useEffect(() => {
    if (count >= reps) dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, reps]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Text style={styles.time}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
      <Text style={styles.label}>Time to wake up.</Text>

      <View style={styles.counter}>
        <Text style={styles.countNum}>{count}</Text>
        <Text style={styles.countOf}>/ {reps}</Text>
        <Text style={styles.countLabel}>push-ups</Text>
      </View>

      {mode === 'idle' ? (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setMode('counting')}>
          <Text style={styles.startTxt}>I'm Ready</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.manualArea}>
          <Text style={styles.manualHint}>
            Tap the button once per push-up
          </Text>
          <TouchableOpacity
            style={styles.repBtn}
            onPress={() => setCount(c => c + 1)}
            activeOpacity={0.7}>
            <Text style={styles.repBtnTxt}>REP</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={dismiss} style={styles.skipBtn}>
        <Text style={styles.skipTxt}>Skip (no push-ups)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  time: {fontSize: 64, fontWeight: '200', color: '#fff', letterSpacing: -2},
  label: {fontSize: 18, color: '#555', marginTop: -16},
  counter: {alignItems: 'center'},
  countNum: {fontSize: 120, fontWeight: '700', color: '#FF6B00', lineHeight: 120},
  countOf: {fontSize: 24, color: '#444', marginTop: -8},
  countLabel: {fontSize: 16, color: '#444', marginTop: 4},
  startBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 40,
  },
  startTxt: {fontSize: 20, fontWeight: '700', color: '#fff'},
  manualArea: {alignItems: 'center', gap: 20},
  manualHint: {fontSize: 14, color: '#555'},
  repBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  repBtnTxt: {fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2},
  skipBtn: {paddingVertical: 12},
  skipTxt: {fontSize: 14, color: '#333'},
});
