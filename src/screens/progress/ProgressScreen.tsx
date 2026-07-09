import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useBankStore} from '../../store/bankStore';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;
type Sheet = 'closed' | 'intro' | 'mode' | 'manual';

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const {totalReps, currentStreak, longestStreak, hasSeenBankIntro, markIntroSeen, addReps} = useBankStore();
  const [sheet, setSheet] = useState<Sheet>('closed');
  const [manualInput, setManualInput] = useState('');

  const openBank = () => setSheet(hasSeenBankIntro ? 'mode' : 'intro');

  const handleIntroNext = () => {
    markIntroSeen();
    setSheet('mode');
  };

  const handleCamera = () => {
    setSheet('closed');
    // small delay so modal finishes closing before full-screen nav
    setTimeout(() => navigation.navigate('BankCamera'), 150);
  };

  const submitManual = () => {
    const n = parseInt(manualInput, 10);
    if (n > 0) addReps(n);
    setManualInput('');
    setSheet('closed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Progress</Text>

      <TouchableOpacity style={styles.bankBtn} onPress={openBank} activeOpacity={0.85}>
        <View style={styles.bankBtnInner}>
          <Text style={styles.bankBtnEmoji}>💪</Text>
          <View style={styles.bankBtnText}>
            <Text style={styles.bankBtnTitle}>Bank Push-ups</Text>
            <Text style={styles.bankBtnSub}>Add reps to your reward bank</Text>
          </View>
          <Text style={styles.bankBtnArrow}>›</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalReps.toLocaleString()}</Text>
          <Text style={styles.statLabel}>banked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}
          </Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
      </View>
      {longestStreak > 0 && (
        <Text style={styles.bestStreak}>Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}</Text>
      )}

      <Modal
        visible={sheet !== 'closed'}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet('closed')}>
        <View style={styles.modalBackdrop}>
          {sheet === 'intro' && (
            <View style={styles.sheet}>
              <View style={styles.sheetPill} />
              <Text style={styles.introHeading}>Earn while you grind.</Text>
              <Text style={styles.introBody}>
                Every push-up you do adds to your bank. Cash it in for anything you want — TV
                time, money, a new fit. You set the rewards. You set the price.
              </Text>
              <TouchableOpacity style={styles.ctaBtn} onPress={handleIntroNext} activeOpacity={0.85}>
                <Text style={styles.ctaBtnTxt}>Let's go</Text>
              </TouchableOpacity>
            </View>
          )}

          {sheet === 'mode' && (
            <View style={styles.sheet}>
              <View style={styles.sheetPill} />
              <Text style={styles.sheetTitle}>How do you want to log?</Text>
              <TouchableOpacity style={styles.modeCard} onPress={handleCamera} activeOpacity={0.85}>
                <Text style={styles.modeEmoji}>📷</Text>
                <View style={styles.modeText}>
                  <Text style={styles.modeName}>Use Camera</Text>
                  <Text style={styles.modeSub}>Auto-count with your camera</Text>
                </View>
                <Text style={styles.modeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeCard, styles.modeCardAlt]}
                onPress={() => setSheet('manual')}
                activeOpacity={0.85}>
                <Text style={styles.modeEmoji}>✏️</Text>
                <View style={styles.modeText}>
                  <Text style={styles.modeName}>Enter Manually</Text>
                  <Text style={styles.modeSub}>Just type the number</Text>
                </View>
                <Text style={styles.modeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSheet('closed')} style={styles.cancelRow}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {sheet === 'manual' && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.kvView}>
              <View style={styles.sheet}>
                <View style={styles.sheetPill} />
                <Text style={styles.sheetTitle}>How many did you do?</Text>
                <TextInput
                  style={styles.manualInput}
                  value={manualInput}
                  onChangeText={setManualInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#333"
                  autoFocus
                  maxLength={4}
                />
                <TouchableOpacity
                  style={[styles.ctaBtn, !parseInt(manualInput, 10) && styles.ctaBtnDisabled]}
                  onPress={submitManual}
                  activeOpacity={0.85}>
                  <Text style={styles.ctaBtnTxt}>Add to Bank</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSheet('mode')} style={styles.cancelRow}>
                  <Text style={styles.cancelTxt}>← Back</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  header: {fontSize: 32, fontWeight: '700', color: '#fff', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20},

  bankBtn: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#141414',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    overflow: 'hidden',
  },
  bankBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B00',
  },
  bankBtnEmoji: {fontSize: 28},
  bankBtnText: {flex: 1},
  bankBtnTitle: {fontSize: 17, fontWeight: '700', color: '#fff'},
  bankBtnSub: {fontSize: 13, color: '#555', marginTop: 2},
  bankBtnArrow: {fontSize: 24, color: '#FF6B00', fontWeight: '300'},

  statsRow: {flexDirection: 'row', gap: 12, paddingHorizontal: 16},
  statCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 20,
    alignItems: 'center',
  },
  statNum: {fontSize: 36, fontWeight: '700', color: '#FF6B00'},
  statLabel: {fontSize: 12, color: '#555', marginTop: 4, letterSpacing: 0.5},
  bestStreak: {fontSize: 13, color: '#333', textAlign: 'center', marginTop: 12},

  // Modal / sheet
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)'},
  kvView: {justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  sheetPill: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 28,
  },

  introHeading: {fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16, letterSpacing: -0.5},
  introBody: {fontSize: 16, color: '#888', lineHeight: 26, marginBottom: 32},

  sheetTitle: {fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20},

  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    gap: 14,
  },
  modeCardAlt: {backgroundColor: '#181818'},
  modeEmoji: {fontSize: 26},
  modeText: {flex: 1},
  modeName: {fontSize: 16, fontWeight: '600', color: '#fff'},
  modeSub: {fontSize: 13, color: '#555', marginTop: 2},
  modeArrow: {fontSize: 22, color: '#333'},

  manualInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B00',
    textAlign: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },

  ctaBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 40,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaBtnDisabled: {backgroundColor: '#2a1a00'},
  ctaBtnTxt: {fontSize: 17, fontWeight: '700', color: '#fff'},

  cancelRow: {alignItems: 'center', paddingVertical: 8},
  cancelTxt: {fontSize: 15, color: '#444'},
});
