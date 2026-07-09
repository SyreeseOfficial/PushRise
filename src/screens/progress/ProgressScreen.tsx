import React, {useState} from 'react';
import {View, Modal, KeyboardAvoidingView, Platform} from 'react-native';
import {
  Appbar, Text, Button, Surface, TextInput, TouchableRipple, useTheme,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useBankStore} from '../../store/bankStore';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;
type Sheet = 'closed' | 'intro' | 'mode' | 'manual';

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const {totalReps, currentStreak, longestStreak, hasSeenBankIntro, markIntroSeen, addReps} = useBankStore();
  const [sheet, setSheet] = useState<Sheet>('closed');
  const [manualInput, setManualInput] = useState('');

  const openBank = () => setSheet(hasSeenBankIntro ? 'mode' : 'intro');
  const handleIntroNext = () => { markIntroSeen(); setSheet('mode'); };
  const handleCamera = () => {
    setSheet('closed');
    setTimeout(() => navigation.navigate('BankCamera'), 150);
  };
  const submitManual = () => {
    const n = parseInt(manualInput, 10);
    if (n > 0) addReps(n);
    setManualInput('');
    setSheet('closed');
  };

  const sheetBg = {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  };

  const pill = {
    width: 40, height: 4,
    backgroundColor: theme.colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center' as const,
    marginBottom: 28,
  };

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Appbar.Header>
        <Appbar.Content title="Progress" />
      </Appbar.Header>

      {/* Bank CTA */}
      <TouchableRipple onPress={openBank} style={{marginHorizontal: 16, marginBottom: 16, borderRadius: 16}} borderless>
        <Surface
          elevation={1}
          style={{
            borderRadius: 16,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.primary,
          }}>
          <Text style={{fontSize: 28}}>💪</Text>
          <View style={{flex: 1}}>
            <Text variant="titleMedium">Bank Push-ups</Text>
            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 2}}>
              Add reps to your reward bank
            </Text>
          </View>
          <Text variant="titleLarge" style={{color: theme.colors.primary}}>›</Text>
        </Surface>
      </TouchableRipple>

      {/* Stats */}
      <View style={{flexDirection: 'row', gap: 12, paddingHorizontal: 16}}>
        <Surface elevation={1} style={{flex: 1, borderRadius: 16, padding: 20, alignItems: 'center'}}>
          <Text style={{fontSize: 36, fontWeight: '700', color: theme.colors.primary}}>
            {totalReps.toLocaleString()}
          </Text>
          <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>
            banked
          </Text>
        </Surface>
        <Surface elevation={1} style={{flex: 1, borderRadius: 16, padding: 20, alignItems: 'center'}}>
          <Text style={{fontSize: 36, fontWeight: '700', color: theme.colors.primary}}>
            {currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}
          </Text>
          <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>
            day streak
          </Text>
        </Surface>
      </View>
      {longestStreak > 0 && (
        <Text variant="labelSmall" style={{color: theme.colors.outline, textAlign: 'center', marginTop: 12}}>
          Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Bottom sheet via RN Modal for slide animation */}
      <Modal
        visible={sheet !== 'closed'}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet('closed')}>
        <View style={{flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.backdrop}}>
          {sheet === 'intro' && (
            <View style={sheetBg}>
              <View style={pill} />
              <Text variant="headlineSmall" style={{fontWeight: '800', marginBottom: 16}}>
                Earn while you grind.
              </Text>
              <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 32}}>
                Every push-up you do adds to your bank. Cash it in for anything you want — TV
                time, money, a new fit. You set the rewards. You set the price.
              </Text>
              <Button mode="contained" onPress={handleIntroNext} contentStyle={{paddingVertical: 8}}>
                Let's go
              </Button>
            </View>
          )}

          {sheet === 'mode' && (
            <View style={sheetBg}>
              <View style={pill} />
              <Text variant="titleLarge" style={{marginBottom: 20}}>How do you want to log?</Text>
              <TouchableRipple onPress={handleCamera} borderless style={{borderRadius: 16, marginBottom: 10}}>
                <Surface elevation={1} style={{borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14}}>
                  <Text style={{fontSize: 26}}>📷</Text>
                  <View style={{flex: 1}}>
                    <Text variant="titleMedium">Use Camera</Text>
                    <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>Auto-count with your camera</Text>
                  </View>
                  <Text style={{color: theme.colors.onSurfaceVariant}}>›</Text>
                </Surface>
              </TouchableRipple>
              <TouchableRipple onPress={() => setSheet('manual')} borderless style={{borderRadius: 16, marginBottom: 8}}>
                <Surface elevation={1} style={{borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14}}>
                  <Text style={{fontSize: 26}}>✏️</Text>
                  <View style={{flex: 1}}>
                    <Text variant="titleMedium">Enter Manually</Text>
                    <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>Just type the number</Text>
                  </View>
                  <Text style={{color: theme.colors.onSurfaceVariant}}>›</Text>
                </Surface>
              </TouchableRipple>
              <Button mode="text" onPress={() => setSheet('closed')} style={{marginTop: 4}}>
                Cancel
              </Button>
            </View>
          )}

          {sheet === 'manual' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{justifyContent: 'flex-end'}}>
              <View style={sheetBg}>
                <View style={pill} />
                <Text variant="titleLarge" style={{marginBottom: 20}}>How many did you do?</Text>
                <TextInput
                  mode="outlined"
                  value={manualInput}
                  onChangeText={setManualInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  autoFocus
                  maxLength={4}
                  contentStyle={{fontSize: 48, fontWeight: '700', textAlign: 'center', color: theme.colors.primary}}
                  style={{marginBottom: 20}}
                />
                <Button
                  mode="contained"
                  onPress={submitManual}
                  disabled={!parseInt(manualInput, 10)}
                  contentStyle={{paddingVertical: 8}}
                  style={{marginBottom: 12}}>
                  Add to Bank
                </Button>
                <Button mode="text" onPress={() => setSheet('mode')}>← Back</Button>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </View>
  );
}
