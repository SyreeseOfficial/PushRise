import React, {useEffect, useRef, useState} from 'react';
import {Animated, FlatList, View, TouchableOpacity} from 'react-native';
import {Switch, IconButton, Text, Icon, useTheme} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAlarmStore, Alarm} from '../../store/alarmStore';
import {useBankStore} from '../../store/bankStore';
import {BRAND_GRADIENT, cardShadow} from '../../theme';
import {getTickerMessages} from '../../utils/engagement';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;

function ActivityTicker() {
  const theme = useTheme();
  const c = theme.colors;
  const messages = useRef(getTickerMessages()).current;
  const [index, setIndex] = useState(0);
  const translateY = useRef(new Animated.Value(14)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;

    function cycle() {
      if (!active) return;
      Animated.parallel([
        Animated.timing(translateY, {toValue: 0, duration: 350, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 1, duration: 350, useNativeDriver: true}),
      ]).start(() => {
        setTimeout(() => {
          if (!active) return;
          Animated.parallel([
            Animated.timing(translateY, {toValue: -14, duration: 300, useNativeDriver: true}),
            Animated.timing(opacity, {toValue: 0, duration: 300, useNativeDriver: true}),
          ]).start(() => {
            if (!active) return;
            setIndex(i => (i + 1) % messages.length);
            translateY.setValue(14);
            cycle();
          });
        }, 3800);
      });
    }

    cycle();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 24, marginBottom: 4,
      height: 28, gap: 8, overflow: 'hidden',
    }}>
      {/* Pulsing live dot */}
      <View style={{width: 7, height: 7, borderRadius: 4, backgroundColor: c.primary}} />
      <Animated.Text
        numberOfLines={1}
        style={{
          flex: 1, fontSize: 13, fontWeight: '500',
          color: c.onSurfaceVariant,
          transform: [{translateY}],
          opacity,
        }}>
        {messages[index]}
      </Animated.Text>
    </View>
  );
}

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return {time: `${h}:${m}`, ampm};
}

function AlarmCard({alarm}: {alarm: Alarm}) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const {toggleAlarm, deleteAlarm} = useAlarmStore();
  const {time, ampm} = formatTime(alarm.hour, alarm.minute);
  const enabled = alarm.enabled;

  const daysLabel = alarm.days.length === 0
    ? 'One-time'
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, i) => alarm.days.includes(i)).join(' · ');

  return (
    <View style={[{
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 20,
      opacity: enabled ? 1 : 0.45,
    }, theme.dark ? {} : cardShadow]}>
      {/* Time row */}
      <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 6}}>
          <Text style={{
            fontSize: 52,
            fontWeight: '700',
            letterSpacing: -2,
            color: enabled ? theme.colors.primary : theme.colors.onSurfaceVariant,
            lineHeight: 56,
          }}>
            {time}
          </Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: enabled ? theme.colors.primary : theme.colors.onSurfaceVariant,
            marginBottom: 6,
            opacity: 0.75,
          }}>
            {ampm}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={() => toggleAlarm(alarm.id)}
          color={theme.colors.primary}
        />
      </View>

      {/* Info + delete row */}
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8}}>
        <View style={{gap: 2}}>
          <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant, fontWeight: '500'}}>
            {daysLabel}
          </Text>
          <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant}}>
            {alarm.reps} push-ups to dismiss
            {alarm.label ? `  ·  ${alarm.label}` : ''}
          </Text>
        </View>
        <IconButton
          icon="pencil-outline"
          iconColor={theme.colors.onSurfaceVariant}
          size={20}
          onPress={() => navigation.navigate('AddAlarm', {alarmId: alarm.id})}
          style={{margin: 0}}
        />
        <IconButton
          icon="trash-can-outline"
          iconColor={theme.colors.onSurfaceVariant}
          size={20}
          onPress={() => deleteAlarm(alarm.id)}
          style={{margin: 0}}
        />
      </View>
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
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <Text style={{fontSize: 34, fontWeight: '800', color: theme.colors.onBackground, letterSpacing: -0.5}}>
          Alarms
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceVariant,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 100,
          gap: 4,
        }}>
          <Text style={{fontSize: 16}}>🔥</Text>
          <Text style={{fontSize: 14, fontWeight: '700', color: theme.colors.onBackground}}>
            {totalReps.toLocaleString()}
          </Text>
        </View>
      </View>

      <ActivityTicker />

      <FlatList
        data={alarms}
        keyExtractor={a => a.id}
        renderItem={({item}) => <AlarmCard alarm={item} />}
        contentContainerStyle={[
          {paddingTop: 4, paddingBottom: 120},
          alarms.length === 0 && {flex: 1},
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8}}>
            <Text style={{fontSize: 48}}>⏰</Text>
            <Text variant="titleMedium" style={{color: theme.colors.onSurfaceVariant, fontWeight: '600'}}>
              No alarms set
            </Text>
            <Text variant="bodyMedium" style={{color: theme.colors.outline}}>
              Tap + to create your first alarm
            </Text>
          </View>
        }
      />

      {/* Gradient FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddAlarm')}
        activeOpacity={0.85}
        style={{position: 'absolute', bottom: 100, right: 24}}>
        <LinearGradient
          colors={BRAND_GRADIENT.colors}
          start={BRAND_GRADIENT.start}
          end={BRAND_GRADIENT.end}
          style={{
            width: 60, height: 60, borderRadius: 18,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#FF4500',
            shadowOffset: {width: 0, height: 6},
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}>
          <Icon source="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
