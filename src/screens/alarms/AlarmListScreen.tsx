import React from 'react';
import {View, Text, FlatList, TouchableOpacity, Switch, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAlarmStore, Alarm} from '../../store/alarmStore';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

function AlarmRow({alarm}: {alarm: Alarm}) {
  const {toggleAlarm, deleteAlarm} = useAlarmStore();
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.time}>{formatTime(alarm.hour, alarm.minute)}</Text>
        <Text style={styles.label}>
          {alarm.label || (alarm.days.length === 0 ? 'One-time' : 'Daily')} ·{' '}
          {alarm.reps} push-ups
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Switch
          value={alarm.enabled}
          onValueChange={() => toggleAlarm(alarm.id)}
          trackColor={{false: '#333', true: '#FF6B00'}}
          thumbColor="#fff"
        />
        <TouchableOpacity onPress={() => deleteAlarm(alarm.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AlarmListScreen() {
  const navigation = useNavigation<Nav>();
  const {alarms} = useAlarmStore();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Alarms</Text>
      <FlatList
        data={alarms}
        keyExtractor={a => a.id}
        renderItem={({item}) => <AlarmRow alarm={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No alarms set.</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to create your first one.
            </Text>
          </View>
        }
        contentContainerStyle={alarms.length === 0 && styles.emptyContainer}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddAlarm')}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    padding: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  rowLeft: {flex: 1},
  rowRight: {flexDirection: 'row', alignItems: 'center', gap: 12},
  time: {fontSize: 40, fontWeight: '300', color: '#fff', letterSpacing: -1},
  label: {fontSize: 13, color: '#666', marginTop: 2},
  deleteBtn: {padding: 8},
  deleteTxt: {fontSize: 16, color: '#444'},
  empty: {alignItems: 'center', paddingTop: 40},
  emptyContainer: {flex: 1, justifyContent: 'center'},
  emptyTitle: {fontSize: 18, color: '#444', fontWeight: '600'},
  emptySubtitle: {fontSize: 14, color: '#333', marginTop: 8},
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabTxt: {fontSize: 32, color: '#fff', lineHeight: 36},
});
