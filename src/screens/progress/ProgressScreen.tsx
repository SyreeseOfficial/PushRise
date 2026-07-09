import React, {useState} from 'react';
import {View, Modal, KeyboardAvoidingView, Platform, TouchableOpacity} from 'react-native';
import {Text, Button, TextInput, useTheme} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useBankStore} from '../../store/bankStore';
import {useSettingsStore} from '../../store/settingsStore';
import {BRAND_GRADIENT, cardShadow} from '../../theme';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;
type Sheet = 'closed' | 'intro' | 'mode' | 'manual';

function StatCard({value, label}: {value: string; label: string}) {
  const theme = useTheme();
  return (
    <View style={[{
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
    }, theme.dark ? {} : cardShadow]}>
      <Text style={{
        fontSize: 38,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: -1,
        lineHeight: 44,
      }}>
        {value}
      </Text>
      <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: '500'}}>
        {label}
      </Text>
    </View>
  );
}

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const c = theme.colors;

  const {totalReps, todayReps, currentStreak, longestStreak, hasSeenBankIntro, markIntroSeen, addReps} = useBankStore();
  const {dailyGoal} = useSettingsStore();

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
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  };

  const goalProgress = dailyGoal > 0 ? Math.min(todayReps / dailyGoal, 1) : 0;

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      {/* Large title header */}
      <View style={{paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20}}>
        <Text style={{fontSize: 34, fontWeight: '800', color: c.onBackground, letterSpacing: -0.5}}>
          Progress
        </Text>
      </View>

      <View style={{paddingHorizontal: 16, gap: 12}}>
        {/* Bank Push-ups hero — gradient card */}
        <TouchableOpacity onPress={openBank} activeOpacity={0.9}>
          <LinearGradient
            colors={BRAND_GRADIENT.colors}
            start={BRAND_GRADIENT.start}
            end={BRAND_GRADIENT.end}
            style={{
              borderRadius: 24,
              padding: 22,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              shadowColor: '#FF4500',
              shadowOffset: {width: 0, height: 8},
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            }}>
            <Text style={{fontSize: 36}}>💪🏽</Text>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3}}>
                Bank Push-ups
              </Text>
              <Text style={{fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3}}>
                Add reps to your reward bank
              </Text>
            </View>
            <Text style={{fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: '300'}}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={{flexDirection: 'row', gap: 12}}>
          <StatCard value={totalReps.toLocaleString()} label="banked reps" />
          <StatCard
            value={currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}
            label="day streak"
          />
        </View>

        {longestStreak > 0 && (
          <Text style={{
            fontSize: 12,
            color: c.onSurfaceVariant,
            textAlign: 'center',
            fontWeight: '500',
          }}>
            Best streak: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Daily goal card */}
        {dailyGoal > 0 && (
          <View style={[{
            backgroundColor: c.surface,
            borderRadius: 20,
            padding: 20,
          }, theme.dark ? {} : cardShadow]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14}}>
              <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Today's Goal</Text>
              <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4}}>
                <Text style={{fontSize: 22, fontWeight: '800', color: c.primary}}>
                  {todayReps}
                </Text>
                <Text style={{fontSize: 14, color: c.onSurfaceVariant, fontWeight: '500'}}>
                  / {dailyGoal}
                </Text>
              </View>
            </View>
            {/* Gradient progress track */}
            <View style={{height: 8, backgroundColor: c.surfaceVariant, borderRadius: 100, overflow: 'hidden'}}>
              <LinearGradient
                colors={BRAND_GRADIENT.colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{
                  height: 8,
                  borderRadius: 100,
                  width: `${Math.max(goalProgress * 100, 0)}%`,
                }}
              />
            </View>
            {todayReps >= dailyGoal && (
              <Text style={{fontSize: 13, color: c.primary, marginTop: 10, fontWeight: '700'}}>
                🎉 Goal crushed!
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Bottom sheet */}
      <Modal
        visible={sheet !== 'closed'}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet('closed')}>
        <View style={{flex: 1, justifyContent: 'flex-end', backgroundColor: c.backdrop}}>

          {sheet === 'intro' && (
            <View style={sheetBg}>
              <View style={{width: 40, height: 4, backgroundColor: c.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 28}} />
              <Text style={{fontSize: 26, fontWeight: '800', color: c.onSurface, letterSpacing: -0.5, marginBottom: 14}}>
                Earn while you grind.
              </Text>
              <Text style={{fontSize: 16, color: c.onSurfaceVariant, lineHeight: 26, marginBottom: 32}}>
                Every push-up you do adds to your bank. Cash it in for anything you want — TV time, money, a new fit. You set the rewards. You set the price.
              </Text>
              <Button mode="contained" onPress={handleIntroNext} contentStyle={{paddingVertical: 8}}>
                Let's go
              </Button>
            </View>
          )}

          {sheet === 'mode' && (
            <View style={sheetBg}>
              <View style={{width: 40, height: 4, backgroundColor: c.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 24}} />
              <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, marginBottom: 16, letterSpacing: -0.3}}>
                How do you want to log?
              </Text>

              <TouchableOpacity onPress={handleCamera} activeOpacity={0.8}>
                <View style={[{
                  backgroundColor: c.surface,
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 10,
                }, theme.dark ? {backgroundColor: c.surfaceVariant} : cardShadow]}>
                  <Text style={{fontSize: 26}}>📷</Text>
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Use Camera</Text>
                    <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 2}}>Auto-count with pose detection</Text>
                  </View>
                  <Text style={{color: c.onSurfaceVariant, fontSize: 18}}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSheet('manual')} activeOpacity={0.8}>
                <View style={[{
                  backgroundColor: c.surface,
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 16,
                }, theme.dark ? {backgroundColor: c.surfaceVariant} : cardShadow]}>
                  <Text style={{fontSize: 26}}>✏️</Text>
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}}>Enter Manually</Text>
                    <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 2}}>Just type the number</Text>
                  </View>
                  <Text style={{color: c.onSurfaceVariant, fontSize: 18}}>›</Text>
                </View>
              </TouchableOpacity>

              <Button mode="text" onPress={() => setSheet('closed')} style={{marginTop: 4}}>
                Cancel
              </Button>
            </View>
          )}

          {sheet === 'manual' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{justifyContent: 'flex-end'}}>
              <View style={sheetBg}>
                <View style={{width: 40, height: 4, backgroundColor: c.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 24}} />
                <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, marginBottom: 20, letterSpacing: -0.3}}>
                  How many did you do?
                </Text>
                <TextInput
                  mode="outlined"
                  value={manualInput}
                  onChangeText={setManualInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  autoFocus
                  maxLength={4}
                  contentStyle={{fontSize: 48, fontWeight: '800', textAlign: 'center', color: c.primary}}
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
