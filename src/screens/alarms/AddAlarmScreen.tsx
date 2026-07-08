import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, TextInput, Switch, ScrollView, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Sound from 'react-native-sound';
import {useNavigation} from '@react-navigation/native';
import {useAlarmStore} from '../../store/alarmStore';

Sound.setCategory('Alarm');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const VOLUME_LEVELS = [
  {value: 0,    label: '🔇'},
  {value: 0.25, label: '🔈'},
  {value: 0.5,  label: '🔉'},
  {value: 0.75, label: '🔊'},
  {value: 1.0,  label: '🔊+'},
];

// Add audio files to android/app/src/main/assets/ to unlock additional sounds
const SOUNDS = [
  {id: 'alarm.mp3',  label: 'Classic'},
  {id: 'digital.mp3', label: 'Digital'},
  {id: 'gentle.mp3',  label: 'Gentle Rise'},
];

export default function AddAlarmScreen() {
  const navigation = useNavigation();
  const {addAlarm} = useAlarmStore();
  const previewRef = useRef<Sound | null>(null);

  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [reps, setReps] = useState('10');
  const [label, setLabel] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [volume, setVolume] = useState(1.0);
  const [sound, setSound] = useState('alarm.mp3');

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
    await addAlarm({
      hour: time.getHours(),
      minute: time.getMinutes(),
      reps: parseInt(reps, 10) || 10,
      label,
      days: recurring ? days : [],
      volume,
      sound,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Alarm</Text>
        <TouchableOpacity onPress={save}>
          <Text style={styles.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'android' ? 'spinner' : 'spinner'}
          onChange={(_, d) => d && setTime(d)}
          textColor="#fff"
          style={styles.picker}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Push-ups to dismiss</Text>
          <TextInput
            style={styles.repsInput}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Volume</Text>
          <View style={styles.segRow}>
            {VOLUME_LEVELS.map(l => (
              <TouchableOpacity
                key={l.value}
                style={[styles.segBtn, volume === l.value && styles.segBtnActive]}
                onPress={() => setVolume(l.value)}>
                <Text style={[styles.segTxt, volume === l.value && styles.segTxtActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sound</Text>
          {SOUNDS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={styles.soundRow}
              onPress={() => { setSound(s.id); previewSound(s.id); }}
              activeOpacity={0.75}>
              <View style={styles.soundLeft}>
                <View style={[styles.radioOuter, sound === s.id && styles.radioOuterActive]}>
                  {sound === s.id && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.soundLabel, sound === s.id && styles.soundLabelActive]}>
                  {s.label}
                </Text>
              </View>
              <Text style={styles.soundPlay}>▶</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Label (optional)</Text>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={setLabel}
            placeholder="Morning grind…"
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Repeat</Text>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{false: '#333', true: '#FF6B00'}}
              thumbColor="#fff"
            />
          </View>
          {recurring && (
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, days.includes(i) && styles.dayBtnActive]}
                  onPress={() => toggleDay(i)}>
                  <Text style={[styles.dayTxt, days.includes(i) && styles.dayTxtActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  cancel: {fontSize: 16, color: '#666'},
  title: {fontSize: 17, fontWeight: '600', color: '#fff'},
  saveBtn: {fontSize: 16, color: '#FF6B00', fontWeight: '700'},
  body: {flex: 1},
  bodyContent: {paddingBottom: 40},
  picker: {alignSelf: 'center', marginVertical: 8},
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionLabel: {fontSize: 13, color: '#666', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5},
  repsInput: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FF6B00',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    width: 100,
  },

  // Volume segmented control
  segRow: {flexDirection: 'row', gap: 8},
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  segBtnActive: {backgroundColor: '#FF6B00'},
  segTxt: {fontSize: 18, color: '#555'},
  segTxtActive: {color: '#fff'},

  // Sound picker
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  soundLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {borderColor: '#FF6B00'},
  radioInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B00'},
  soundLabel: {fontSize: 16, color: '#555'},
  soundLabelActive: {color: '#fff'},
  soundPlay: {fontSize: 12, color: '#333'},

  labelInput: {
    fontSize: 16,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 8,
  },
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  daysRow: {flexDirection: 'row', gap: 8, marginTop: 12},
  dayBtn: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1a1a1a'},
  dayBtnActive: {backgroundColor: '#FF6B00'},
  dayTxt: {fontSize: 12, color: '#555', fontWeight: '600'},
  dayTxtActive: {color: '#fff'},
});
