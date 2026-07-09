import React from 'react';
import {FlatList, View} from 'react-native';
import {
  Appbar, FAB, Switch, IconButton, Text,
  Divider, useTheme,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAlarmStore, Alarm} from '../../store/alarmStore';
import {useBankStore} from '../../store/bankStore';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

function AlarmRow({alarm}: {alarm: Alarm}) {
  const theme = useTheme();
  const {toggleAlarm, deleteAlarm} = useAlarmStore();
  const sublabel = alarm.label || (alarm.days.length === 0 ? 'One-time' : 'Daily');
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      opacity: alarm.enabled ? 1 : 0.5,
    }}>
      <View style={{flex: 1}}>
        <Text style={{fontSize: 40, fontWeight: '300', letterSpacing: -1, color: theme.colors.onSurface}}>
          {formatTime(alarm.hour, alarm.minute)}
        </Text>
        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 2}}>
          {sublabel} · {alarm.reps} push-ups
        </Text>
      </View>
      <Switch value={alarm.enabled} onValueChange={() => toggleAlarm(alarm.id)} />
      <IconButton
        icon="delete-outline"
        iconColor={theme.colors.onSurfaceVariant}
        onPress={() => deleteAlarm(alarm.id)}
      />
    </View>
  );
}

export default function AlarmListScreen() {
  const navigation = useNavigation<Nav>();
  const {alarms} = useAlarmStore();
  const {totalReps} = useBankStore();
  const theme = useTheme();

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Appbar.Header>
        <Appbar.Content title="Alarms" />
        <Text style={{color: theme.colors.primary, fontWeight: '600', marginRight: 12}}>
          🔥 {totalReps.toLocaleString()}
        </Text>
      </Appbar.Header>

      <FlatList
        data={alarms}
        keyExtractor={a => a.id}
        renderItem={({item}) => <AlarmRow alarm={item} />}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80}}>
            <Text variant="titleMedium" style={{color: theme.colors.onSurfaceVariant}}>
              No alarms set
            </Text>
            <Text variant="bodyMedium" style={{color: theme.colors.outline, marginTop: 8}}>
              Tap + to create your first one
            </Text>
          </View>
        }
        contentContainerStyle={alarms.length === 0 ? {flex: 1} : undefined}
      />

      <FAB
        icon="plus"
        variant="primary"
        style={{position: 'absolute', bottom: 88, right: 24}}
        onPress={() => navigation.navigate('AddAlarm')}
      />
    </View>
  );
}
