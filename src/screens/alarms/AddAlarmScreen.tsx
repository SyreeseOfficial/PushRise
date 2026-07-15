import React, {useState, useRef} from 'react';
import {View, ScrollView} from 'react-native';
import {
  Appbar, Button, Text, TextInput, Switch, Chip,
  SegmentedButtons, RadioButton, TouchableRipple, useTheme, Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Sound from 'react-native-sound';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {useAlarmStore} from '../../store/alarmStore';
import {useSettingsStore} from '../../store/settingsStore';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Route = RouteProp<RootStackParamList, 'AddAlarm'>;

Sound.setCategory('Alarm');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const VOLUME_BUTTONS = [
  {value: '0',    label: '🔇'},
  {value: '0.25', label: '🔈'},
  {value: '0.5',  label: '🔉'},
  {value: '0.75', label: '🔊'},
  {value: '1.0',  label: '🔊+'},
];

const SOUNDS = [
  {id: 'alarm.mp3',   label: 'Classic'},
  {id: 'digital.mp3', label: 'Digital'},
  {id: 'gentle.mp3',  label: 'Gentle Rise'},
];

export default function AddAlarmScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const alarmId = route.params?.alarmId;
  const theme = useTheme();
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
  const [reps, setReps] = useState(existing ? String(existing.reps) : String(defaultReps));
  const [label, setLabel] = useState(existing?.label ?? '');
  const [recurring, setRecurring] = useState(existing ? existing.days.length > 0 : false);
  const [days, setDays] = useState<number[]>(existing?.days ?? []);
  const [volume, setVolume] = useState(existing ? String(existing.volume) : '1.0');
  const [sound, setSound] = useState(existing?.sound ?? 'alarm.mp3');

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const previewSound = (filename: string) => {
    previewRef.current?.stop();
    previewRef.current?.release();
    const s = new Sound(filename, Sound.MAIN_BUNDLE, err => {
      if (!err) {
        s.setVolume(parseFloat(volume));
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
      reps: parseInt(reps, 10) || 10,
      label,
      days: recurring ? days : [],
      volume: parseFloat(volume),
      sound,
    };
    if (alarmId) {
      await updateAlarm(alarmId, data);
    } else {
      await addAlarm(data);
    }
    navigation.goBack();
  };

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={alarmId ? 'Edit Alarm' : 'New Alarm'} />
        <Appbar.Action icon="check" onPress={save} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        {/* Time display */}
        <TouchableRipple onPress={() => setShowPicker(true)} style={{alignItems: 'center', paddingVertical: 28}}>
          <View style={{alignItems: 'center'}}>
            <Text style={{fontSize: 72, fontWeight: '200', letterSpacing: -2, color: theme.colors.onSurface}}>
              {time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
            <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>
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

        <Divider />

        {/* Push-ups */}
        <View style={{paddingHorizontal: 20, paddingVertical: 20}}>
          <TextInput
            mode="outlined"
            label="Push-ups to dismiss"
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
            contentStyle={{fontSize: 36, fontWeight: '300', color: theme.colors.primary}}
            style={{width: 180}}
          />
        </View>

        <Divider />

        {/* Volume */}
        <View style={{paddingHorizontal: 20, paddingVertical: 20}}>
          <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 12}}>
            Volume
          </Text>
          <SegmentedButtons
            value={volume}
            onValueChange={setVolume}
            buttons={VOLUME_BUTTONS}
          />
        </View>

        <Divider />

        {/* Sound */}
        <View style={{paddingHorizontal: 20, paddingVertical: 20}}>
          <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 4}}>
            Sound
          </Text>
          <RadioButton.Group
            value={sound}
            onValueChange={v => { setSound(v); previewSound(v); }}>
            {SOUNDS.map(s => (
              <RadioButton.Item key={s.id} label={s.label} value={s.id} />
            ))}
          </RadioButton.Group>
        </View>

        <Divider />

        {/* Label */}
        <View style={{paddingHorizontal: 20, paddingVertical: 20}}>
          <TextInput
            mode="outlined"
            label="Label (optional)"
            value={label}
            onChangeText={setLabel}
            placeholder="Morning grind…"
          />
        </View>

        <Divider />

        {/* Repeat */}
        <View style={{paddingHorizontal: 20, paddingVertical: 16}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: recurring ? 16 : 0}}>
            <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant}}>
              Repeat
            </Text>
            <Switch value={recurring} onValueChange={setRecurring} />
          </View>
          {recurring && (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {DAYS.map((d, i) => (
                <Chip
                  key={d}
                  selected={days.includes(i)}
                  onPress={() => toggleDay(i)}
                  compact>
                  {d}
                </Chip>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
