import React, {useState, useRef} from 'react';
import {View, ScrollView, KeyboardAvoidingView, Platform, Vibration} from 'react-native';
import {
  Appbar, Text, TextInput, Switch, Chip,
  TouchableRipple, useTheme, Icon,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import Sound from 'react-native-sound';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {useAlarmStore} from '../../store/alarmStore';
import {useSettingsStore} from '../../store/settingsStore';
import type {RootStackParamList} from '../../navigation/navigationRef';
import {cardShadow} from '../../theme';

type Route = RouteProp<RootStackParamList, 'AddAlarm'>;

Sound.setCategory('Alarm');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SOUNDS = [
  {id: 'alarm.mp3',   label: 'Classic',     icon: 'alarm'},
  {id: 'digital.mp3', label: 'Digital',     icon: 'music-note'},
  {id: 'gentle.mp3',  label: 'Gentle Rise', icon: 'weather-sunny'},
];

export default function AddAlarmScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const alarmId = route.params?.alarmId;
  const theme = useTheme();
  const c = theme.colors;
  const {addAlarm, updateAlarm, alarms} = useAlarmStore();
  const {defaultReps} = useSettingsStore();
  const previewRef = useRef<Sound | null>(null);

  const existing = alarmId ? alarms.find(a => a.id === alarmId) : undefined;

  const [time, setTime] = useState(() => {
    if (existing) {
      const d = new Date();
      d.setHours(existing.hour, existing.minute, 0, 0);
      return d;
    }
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [reps, setReps] = useState(existing ? existing.reps : (parseInt(String(defaultReps), 10) || 10));
  const [label, setLabel] = useState(existing?.label ?? '');
  const [recurring, setRecurring] = useState(existing ? existing.days.length > 0 : false);
  const [days, setDays] = useState<number[]>(existing?.days ?? []);
  const [volume, setVolume] = useState<number>(existing?.volume ?? 1.0);
  const [sound, setSound] = useState(existing?.sound ?? 'alarm.mp3');
  const [snoozeEnabled, setSnoozeEnabled] = useState(existing?.snoozeEnabled ?? false);

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const previewSound = (filename: string) => {
    previewRef.current?.stop();
    previewRef.current?.release();
    const s = new Sound(filename, Sound.MAIN_BUNDLE, err => {
      if (!err) {
        s.setVolume(volume);
        s.play(() => s.release());
        previewRef.current = s;
      }
    });
  };

  const save = async () => {
    previewRef.current?.stop();
    const data = {
      hour: time.getHours(),
      minute: time.getMinutes(),
      reps: reps || 10,
      label,
      days: recurring ? days : [],
      volume,
      sound,
      snoozeEnabled,
    };
    if (alarmId) {
      await updateAlarm(alarmId, data);
    } else {
      await addAlarm(data);
    }
    Vibration.vibrate(50);
    navigation.goBack();
  };

  const card = {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    ...(theme.dark ? {} : cardShadow),
  } as const;

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={alarmId ? 'Edit Alarm' : 'New Alarm'} />
        <Appbar.Action icon="check" onPress={save} />
      </Appbar.Header>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
      <ScrollView contentContainerStyle={{paddingTop: 8, paddingBottom: 40}}>
        {/* Time display */}
        <TouchableRipple onPress={() => setShowPicker(true)} style={{alignItems: 'center', paddingVertical: 28}}>
          <View style={{alignItems: 'center'}}>
            <Text style={{fontSize: 72, fontWeight: '200', letterSpacing: -2, color: c.onSurface}}>
              {time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
            <Text variant="labelSmall" style={{color: c.onSurfaceVariant, marginTop: 4}}>
              Tap to change
            </Text>
          </View>
        </TouchableRipple>

        {showPicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowPicker(false);
              if (event.type !== 'dismissed' && date) setTime(date);
            }}
          />
        )}

        {/* Push-ups stepper */}
        <View style={card}>
          <Text variant="labelLarge" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
            Push-ups to dismiss
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20}}>
            <TouchableRipple
              onPress={() => setReps(r => Math.max(1, r - 5))}
              borderless
              style={{borderRadius: 22}}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: c.primaryContainer,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon source="minus" size={20} color={c.onPrimaryContainer} />
              </View>
            </TouchableRipple>

            <TextInput
              mode="flat"
              value={String(reps)}
              onChangeText={t => {
                const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(n)) setReps(Math.min(999, Math.max(1, n)));
                else if (t === '') setReps(1);
              }}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              contentStyle={{fontSize: 48, fontWeight: '300', color: c.primary, textAlign: 'center'}}
              style={{backgroundColor: 'transparent', width: 100}}
            />

            <TouchableRipple
              onPress={() => setReps(r => Math.min(999, r + 5))}
              borderless
              style={{borderRadius: 22}}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: c.primaryContainer,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon source="plus" size={20} color={c.onPrimaryContainer} />
              </View>
            </TouchableRipple>
          </View>
        </View>

        {/* Volume */}
        <View style={card}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
            <Text variant="labelLarge" style={{color: c.onSurfaceVariant}}>Volume</Text>
            <Text variant="labelLarge" style={{color: c.primary, fontWeight: '700'}}>
              {Math.round(volume * 100)}%
            </Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor={c.primary}
            maximumTrackTintColor={c.surfaceVariant}
            thumbTintColor={c.primary}
          />
        </View>

        {/* Sound */}
        <View style={card}>
          <Text variant="labelLarge" style={{color: c.onSurfaceVariant, marginBottom: 12}}>
            Sound
          </Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            {SOUNDS.map(s => {
              const selected = sound === s.id;
              return (
                <TouchableRipple
                  key={s.id}
                  onPress={() => { setSound(s.id); previewSound(s.id); }}
                  borderless
                  style={{flex: 1, borderRadius: 12}}>
                  <View style={{
                    flex: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 8,
                    alignItems: 'center', gap: 6,
                    backgroundColor: selected ? c.primaryContainer : c.surfaceVariant,
                    borderWidth: selected ? 1.5 : 0,
                    borderColor: c.primary,
                  }}>
                    <Icon source={s.icon} size={22} color={selected ? c.primary : c.onSurfaceVariant} />
                    <Text style={{
                      fontSize: 11, fontWeight: '600', textAlign: 'center',
                      color: selected ? c.primary : c.onSurfaceVariant,
                    }}>
                      {s.label}
                    </Text>
                  </View>
                </TouchableRipple>
              );
            })}
          </View>
        </View>

        {/* Label */}
        <View style={card}>
          <TextInput
            mode="outlined"
            label="Label (optional)"
            value={label}
            onChangeText={setLabel}
            placeholder="Morning grind…"
          />
        </View>

        {/* Snooze */}
        <View style={card}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flex: 1, marginRight: 12}}>
              <Text variant="labelLarge" style={{color: c.onSurfaceVariant}}>Allow Snooze</Text>
              <Text variant="labelSmall" style={{color: c.onSurfaceVariant, opacity: 0.7, marginTop: 2}}>
                5/10/15 min — adds equal pushups to required count
              </Text>
            </View>
            <Switch value={snoozeEnabled} onValueChange={setSnoozeEnabled} />
          </View>
        </View>

        {/* Repeat */}
        <View style={card}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: recurring ? 16 : 0,
          }}>
            <Text variant="labelLarge" style={{color: c.onSurfaceVariant}}>Repeat</Text>
            <Switch value={recurring} onValueChange={setRecurring} />
          </View>
          {recurring && (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {DAYS.map((d, i) => (
                <Chip key={d} selected={days.includes(i)} onPress={() => toggleDay(i)} compact>
                  {d}
                </Chip>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
