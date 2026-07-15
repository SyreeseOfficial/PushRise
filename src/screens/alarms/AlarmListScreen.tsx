import React, {useEffect, useRef, useState} from 'react';
import {Animated, FlatList, PanResponder, Pressable, View, Vibration, TouchableOpacity} from 'react-native';
import {Switch, IconButton, Text, Icon, useTheme} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAlarmStore, Alarm} from '../../store/alarmStore';
import {useBankStore} from '../../store/bankStore';
import {BRAND_GRADIENT, cardShadow} from '../../theme';
import {getTickerMessages} from '../../utils/engagement';
import type {RootStackParamList} from '../../navigation/navigationRef';
import TopToast from '../../components/TopToast';

type Nav = StackNavigationProp<RootStackParamList>;

// #10 — animates a number counter from its previous value to a new one
function AnimatedCounter({value, style}: {value: number; style?: object}) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const id = anim.addListener(({value: v}) => setDisplay(Math.round(v)));
    Animated.timing(anim, {toValue: value, duration: 550, useNativeDriver: false}).start();
    return () => anim.removeListener(id);
  }, [value]);
  return <Text style={style}>{display.toLocaleString()}</Text>;
}

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

function AlarmCard({alarm, index, onShowToast}: {alarm: Alarm; index: number; onShowToast: (msg: string) => void}) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const {toggleAlarm, deleteAlarm, reorderAlarm} = useAlarmStore();
  const {time, ampm} = formatTime(alarm.hour, alarm.minute);
  const enabled = alarm.enabled;

  const daysLabel = alarm.days.length === 0
    ? 'One-time'
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, i) => alarm.days.includes(i)).join(' · ');

  // #4 — staggered slide-in from right on mount
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {toValue: 0, useNativeDriver: true, tension: 60, friction: 10, delay: index * 70} as any),
      Animated.timing(fadeAnim, {toValue: 1, duration: 300, useNativeDriver: true, delay: index * 70}),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // #6 — scale pulse on toggle
  const cardScale = useRef(new Animated.Value(1)).current;
  const handleToggle = () => {
    Vibration.vibrate(30);
    Animated.sequence([
      Animated.spring(cardScale, {toValue: 1.025, useNativeDriver: false, speed: 40}),
      Animated.spring(cardScale, {toValue: 1, useNativeDriver: false, speed: 25}),
    ]).start();
    onShowToast(enabled ? 'Alarm disabled' : 'Alarm enabled');
    toggleAlarm(alarm.id);
  };

  // #17 — shake + double-tap delete
  const [pendingDelete, setPendingDelete] = useState(false);
  const shakeX = useRef(new Animated.Value(0)).current;
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleDelete = () => {
    if (pendingDelete) {
      deleteAlarm(alarm.id);
      return;
    }
    setPendingDelete(true);
    Animated.sequence([
      Animated.timing(shakeX, {toValue: -9, duration: 55, useNativeDriver: false}),
      Animated.timing(shakeX, {toValue: 9, duration: 55, useNativeDriver: false}),
      Animated.timing(shakeX, {toValue: -6, duration: 55, useNativeDriver: false}),
      Animated.timing(shakeX, {toValue: 6, duration: 55, useNativeDriver: false}),
      Animated.timing(shakeX, {toValue: 0, duration: 55, useNativeDriver: false}),
    ]).start();
    clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setPendingDelete(false), 3000);
  };

  // #7 — long-press to show reorder arrows
  const [showMoveControls, setShowMoveControls] = useState(false);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleLongPress = () => {
    Vibration.vibrate(50);
    setShowMoveControls(true);
    clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => setShowMoveControls(false), 4000);
  };

  // #5 — swipe-left to delete via PanResponder
  const swipeX = useRef(new Animated.Value(0)).current;
  const deleteRevealOpacity = swipeX.interpolate({
    inputRange: [-110, -20, 0],
    outputRange: [1, 0.2, 0],
    extrapolate: 'clamp',
  });
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) && gs.dx < 0,
    onPanResponderMove: (_, gs) => { if (gs.dx < 0) swipeX.setValue(gs.dx); },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx < -120) {
        Animated.timing(swipeX, {toValue: -500, duration: 200, useNativeDriver: false}).start(
          () => deleteAlarm(alarm.id),
        );
      } else {
        Animated.spring(swipeX, {toValue: 0, useNativeDriver: false}).start();
      }
    },
  })).current;

  return (
    // Outer: fade + slide in from right on mount (native driver)
    <Animated.View style={{opacity: fadeAnim, transform: [{translateX: slideAnim}]}}>
      <View style={{marginHorizontal: 16, marginBottom: 12}}>
        {/* Delete reveal shown behind card as it swipes left */}
        <Animated.View style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, minWidth: 90,
          backgroundColor: theme.colors.error, borderRadius: 20,
          justifyContent: 'center', alignItems: 'center',
          opacity: deleteRevealOpacity,
        }}>
          <Icon source="trash-can-outline" size={26} color="#fff" />
        </Animated.View>

        {/* Card: handles swipe, shake, scale (all non-native for mix compatibility) */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[{
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 20,
            opacity: enabled ? 1 : 0.45,
            transform: [{scale: cardScale}, {translateX: swipeX}, {translateX: shakeX}],
          }, theme.dark ? {} : cardShadow]}>

          {/* Time row */}
          <Pressable onLongPress={handleLongPress}>
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
                onValueChange={handleToggle}
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
                iconColor={pendingDelete ? theme.colors.error : theme.colors.onSurfaceVariant}
                size={20}
                onPress={handleDelete}
                style={{margin: 0}}
              />
            </View>
          </Pressable>

          {/* #7 — reorder controls (shown on long-press, auto-hide after 4s) */}
          {showMoveControls && (
            <View style={{
              position: 'absolute', top: 8, right: 56,
              flexDirection: 'row', gap: 2,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 10, padding: 4,
            }}>
              <Pressable
                onPress={() => { reorderAlarm(alarm.id, 'up'); setShowMoveControls(false); }}
                style={{padding: 4}}>
                <Icon source="chevron-up" size={20} color={theme.colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => { reorderAlarm(alarm.id, 'down'); setShowMoveControls(false); }}
                style={{padding: 4}}>
                <Icon source="chevron-down" size={20} color={theme.colors.primary} />
              </Pressable>
              <Pressable onPress={() => setShowMoveControls(false)} style={{padding: 4}}>
                <Icon source="close" size={20} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export default function AlarmListScreen() {
  const navigation = useNavigation<Nav>();
  const {alarms} = useAlarmStore();
  const {totalReps} = useBankStore();
  const theme = useTheme();

  // #18 — top toast for alarm toggle feedback
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  };

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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
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
            {/* #10 — animated counter ticks up when reps change */}
            <AnimatedCounter
              value={totalReps}
              style={{fontSize: 14, fontWeight: '700', color: theme.colors.onBackground}}
            />
          </View>
          <IconButton
            icon="cog-outline"
            iconColor={theme.colors.onSurfaceVariant}
            size={22}
            onPress={() => navigation.navigate('Settings')}
            style={{margin: 0}}
          />
        </View>
      </View>

      <ActivityTicker />

      <FlatList
        data={alarms}
        keyExtractor={a => a.id}
        renderItem={({item, index}) => (
          <AlarmCard alarm={item} index={index} onShowToast={showToast} />
        )}
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

      {/* #18 — top toast */}
      <TopToast message={toastMsg} visible={toastVisible} />
    </View>
  );
}
