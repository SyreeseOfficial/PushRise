import React, {useEffect, useRef, useState} from 'react';
import {Animated, PanResponder, Pressable, ScrollView, View, Vibration} from 'react-native';
import {Switch, IconButton, Text, Icon, Button, useTheme, TouchableRipple} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAlarmStore, Alarm} from '../../store/alarmStore';
import {useBankStore} from '../../store/bankStore';
import {useOnboardingStore} from '../../store/onboardingStore';
import {BRAND_GRADIENT, cardShadow} from '../../theme';
import {getTickerMessages} from '../../utils/engagement';
import type {RootStackParamList} from '../../navigation/navigationRef';
import TopToast from '../../components/TopToast';

type Nav = StackNavigationProp<RootStackParamList>;
type DragCallbacks = {
  onStart: (id: string, pageY: number) => void;
  onMove: (pageY: number) => void;
  onEnd: () => void;
};


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

function getNextAlarmTime(alarm: Alarm): Date {
  const now = new Date();
  const candidate = new Date();
  candidate.setHours(alarm.hour, alarm.minute, 0, 0);
  if (alarm.days.length === 0) {
    if (candidate > now) return candidate;
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }
  for (let d = 0; d < 8; d++) {
    const check = new Date(candidate);
    check.setDate(candidate.getDate() + d);
    if (alarm.days.includes(check.getDay()) && check > now) return check;
  }
  return candidate;
}

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return {time: `${h}:${m}`, ampm};
}

function GhostCard({alarm}: {alarm: Alarm}) {
  const theme = useTheme();
  const {time, ampm} = formatTime(alarm.hour, alarm.minute);
  const daysLabel = alarm.days.length === 0
    ? 'One-time'
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, i) => alarm.days.includes(i)).join(' · ');
  return (
    <View style={[{
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: 0.35,
      shadowRadius: 16,
    }, cardShadow]}>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 6}}>
        <Text style={{fontSize: 52, fontWeight: '700', letterSpacing: -2, color: theme.colors.primary, lineHeight: 56}}>
          {time}
        </Text>
        <Text style={{fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 6, opacity: 0.75}}>
          {ampm}
        </Text>
      </View>
      <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4}}>
        {daysLabel}{alarm.label ? `  ·  ${alarm.label}` : ''}
      </Text>
    </View>
  );
}

const AlarmCard = React.memo(function AlarmCard({
  alarm, index, onShowToast, isDragging, dragCallbacksRef,
}: {
  alarm: Alarm;
  index: number;
  onShowToast: (msg: string) => void;
  isDragging: boolean;
  dragCallbacksRef: React.MutableRefObject<DragCallbacks>;
}) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const {toggleAlarm, deleteAlarm} = useAlarmStore();
  const {time, ampm} = formatTime(alarm.hour, alarm.minute);
  const enabled = alarm.enabled;
  const cardOpacity = useRef(new Animated.Value(enabled ? 1 : 0.45)).current;

  const daysLabel = alarm.days.length === 0
    ? 'One-time'
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, i) => alarm.days.includes(i)).join(' · ');

  // Staggered slide-in from right on mount
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {toValue: 0, useNativeDriver: true, tension: 60, friction: 10, delay: index * 70} as any),
      Animated.timing(fadeAnim, {toValue: 1, duration: 300, useNativeDriver: true, delay: index * 70}),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scale pulse on toggle
  const cardScale = useRef(new Animated.Value(1)).current;
  const handleToggle = () => {
    Vibration.vibrate(30);
    Animated.parallel([
      Animated.timing(cardOpacity, {toValue: enabled ? 0.45 : 1, duration: 200, useNativeDriver: true}),
      Animated.sequence([
        Animated.spring(cardScale, {toValue: 1.025, useNativeDriver: true, speed: 40}),
        Animated.spring(cardScale, {toValue: 1, useNativeDriver: true, speed: 25}),
      ]),
    ]).start();
    onShowToast(enabled ? 'Alarm disabled' : 'Alarm enabled');
    toggleAlarm(alarm.id);
  };

  // Shake + double-tap delete
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
      Animated.timing(shakeX, {toValue: -9, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: 9, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: -6, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: 6, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: 0, duration: 55, useNativeDriver: true}),
    ]).start();
    clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setPendingDelete(false), 3000);
  };

  // Drag handle — captures touch immediately
  const dragPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      dragCallbacksRef.current.onStart(alarm.id, evt.nativeEvent.pageY);
    },
    onPanResponderMove: (evt) => {
      dragCallbacksRef.current.onMove(evt.nativeEvent.pageY);
    },
    onPanResponderRelease: () => {
      dragCallbacksRef.current.onEnd();
    },
    onPanResponderTerminate: () => {
      dragCallbacksRef.current.onEnd();
    },
  })).current;

  return (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateX: slideAnim}]}}>
      <View style={{opacity: isDragging ? 0 : 1}}>
        <View style={{marginHorizontal: 16, marginBottom: 12}}>
          {/* Card */}
          <Animated.View
            style={[{
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
              opacity: cardOpacity,
              transform: [{scale: cardScale}, {translateX: shakeX}],
            }, theme.dark ? {} : cardShadow]}>

            <View style={{flexDirection: 'row', alignItems: 'stretch'}}>
              {/* Drag handle */}
              <View {...dragPan.panHandlers} style={{justifyContent: 'center', paddingRight: 12}}>
                <Icon source="drag-vertical" size={24} color={theme.colors.outlineVariant} />
              </View>

              {/* Card content */}
              <Pressable style={{flex: 1}} onPress={() => navigation.navigate('AddAlarm', {alarmId: alarm.id})}>
                <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 6}}>
                    <Text style={{
                      fontSize: 52, fontWeight: '700', letterSpacing: -2,
                      color: enabled ? theme.colors.primary : theme.colors.onSurfaceVariant,
                      lineHeight: 56,
                    }}>
                      {time}
                    </Text>
                    <Text style={{
                      fontSize: 18, fontWeight: '600',
                      color: enabled ? theme.colors.primary : theme.colors.onSurfaceVariant,
                      marginBottom: 6, opacity: 0.75,
                    }}>
                      {ampm}
                    </Text>
                  </View>
                  <Switch value={enabled} onValueChange={handleToggle} color={theme.colors.primary} />
                </View>

                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8}}>
                  <View style={{gap: 2, flex: 1}}>
                    <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant, fontWeight: '500'}}>
                      {daysLabel}
                    </Text>
                    <Text style={{fontSize: 13, color: theme.colors.onSurfaceVariant}} numberOfLines={1}>
                      {alarm.reps} push-ups{alarm.label ? `  ·  ${alarm.label}` : ''}
                    </Text>
                  </View>
                  <View style={{alignItems: 'center'}}>
                    <IconButton
                      icon="trash-can-outline"
                      iconColor={pendingDelete ? theme.colors.error : theme.colors.onSurfaceVariant}
                      size={20}
                      onPress={handleDelete}
                      style={{margin: 0}}
                    />
                    {pendingDelete && (
                      <Text style={{fontSize: 10, color: theme.colors.error, marginTop: -6}}>
                        Tap again
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
});

export default function AlarmListScreen() {
  const navigation = useNavigation<Nav>();
  const {alarms, reorderAlarmToIndex} = useAlarmStore();
  const {totalReps} = useBankStore();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const nextAlarmLabel = React.useMemo(() => {
    const enabled = alarms.filter(a => a.enabled);
    if (!enabled.length) return null;
    const next = enabled.map(getNextAlarmTime).reduce((a, b) => a < b ? a : b);
    const diffMs = next.getTime() - Date.now();
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor((diffMs % 3600000) / 60000);
    const timeStr = next.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    return `Next: ${timeStr}, in ${diffH > 0 ? `${diffH}h ` : ''}${diffM}m`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarms, tick]);
  const {isFirstLaunch, markFirstLaunchSeen} = useOnboardingStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // ponytail: 82 = tab bar bottom offset (12) + bar height (62) + gap (8)
  const fabBottom = Math.max(insets.bottom, 8) + 82;

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = React.useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (isFirstLaunch) {
        showToast("You're in. Tomorrow starts here. 💪");
        markFirstLaunchSeen();
      }
    }, [isFirstLaunch]),
  );

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState(-1);
  const draggingIdRef = useRef<string | null>(null);
  const insertIndexRef = useRef(-1);
  const ghostAnimY = useRef(new Animated.Value(0)).current;
  const intraCardOffsetRef = useRef(0);

  // Position tracking
  const rootViewRef = useRef<View>(null);
  const rootTopRef = useRef(0);
  const listContainerRef = useRef<View>(null);
  const listScreenTopRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const itemLayoutsRef = useRef<Map<string, {y: number; height: number}>>(new Map());

  // Compute where to insert (index in list-without-dragging-item space)
  const computeInsertIndex = (pageY: number): number => {
    let noBIdx = 0;
    for (const alarm of alarms) {
      if (alarm.id === draggingIdRef.current) continue;
      const layout = itemLayoutsRef.current.get(alarm.id);
      if (layout) {
        const midY = listScreenTopRef.current + layout.y + layout.height / 2 - scrollOffsetRef.current;
        if (pageY <= midY) return noBIdx;
      }
      noBIdx++;
    }
    return noBIdx;
  };

  // Drag callbacks — updated every render so closures stay fresh
  const dragCallbacksRef = useRef<DragCallbacks>({
    onStart: () => {},
    onMove: () => {},
    onEnd: () => {},
  });

  dragCallbacksRef.current.onStart = (id, pageY) => {
    const layout = itemLayoutsRef.current.get(id);
    if (!layout) return;
    const cardScreenTop = listScreenTopRef.current + layout.y - scrollOffsetRef.current;
    intraCardOffsetRef.current = pageY - cardScreenTop;
    ghostAnimY.setValue(cardScreenTop - rootTopRef.current);
    draggingIdRef.current = id;
    insertIndexRef.current = alarms.findIndex(a => a.id === id);
    setDraggingId(id);
    setInsertIndex(insertIndexRef.current);
    Vibration.vibrate(40);
  };

  dragCallbacksRef.current.onMove = (pageY) => {
    ghostAnimY.setValue(pageY - rootTopRef.current - intraCardOffsetRef.current);
    const newIdx = computeInsertIndex(pageY);
    if (newIdx !== insertIndexRef.current) {
      insertIndexRef.current = newIdx;
      setInsertIndex(newIdx);
    }
  };

  dragCallbacksRef.current.onEnd = () => {
    const id = draggingIdRef.current;
    if (id && insertIndexRef.current >= 0) {
      reorderAlarmToIndex(id, insertIndexRef.current);
    }
    draggingIdRef.current = null;
    setDraggingId(null);
    setInsertIndex(-1);
  };

  // Map no-B insertIndex to full-list indicator position
  const getDropIndicatorFullIdx = (): number => {
    if (!draggingId || insertIndex < 0) return -1;
    const fromIndex = alarms.findIndex(a => a.id === draggingId);
    return insertIndex <= fromIndex ? insertIndex : insertIndex + 1;
  };
  const dropFullIdx = getDropIndicatorFullIdx();

  const draggingAlarm = draggingId ? alarms.find(a => a.id === draggingId) : null;

  return (
    <View
      ref={rootViewRef}
      style={{flex: 1, backgroundColor: theme.colors.background}}
      onLayout={() => {
        rootViewRef.current?.measure((x, y, w, h, pageX, pageY) => {
          rootTopRef.current = pageY;
        });
      }}
    >
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{fontSize: 34, fontWeight: '800', color: theme.colors.onBackground, letterSpacing: -0.5}}>
            Alarms
          </Text>
          {nextAlarmLabel && (
            <Text style={{fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '500', marginTop: 2}}>
              {nextAlarmLabel}
            </Text>
          )}
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: theme.colors.surfaceVariant,
            paddingHorizontal: 12, paddingVertical: 6,
            borderRadius: 100, gap: 4,
          }}>
            <Text style={{fontSize: 16}}>💪🏽</Text>
            <Text style={{fontSize: 14, fontWeight: '700', color: theme.colors.onBackground}}>{totalReps.toLocaleString()}</Text>
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

      <View
        ref={listContainerRef}
        style={{flex: 1}}
        onLayout={() => {
          listContainerRef.current?.measure((x, y, w, h, pageX, pageY) => {
            listScreenTopRef.current = pageY;
          });
        }}
      >
        <ScrollView
          ref={scrollRef}
          scrollEnabled={!draggingId}
          onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={50}
          contentContainerStyle={[
            {paddingTop: 4, paddingBottom: 120},
            alarms.length === 0 && {flex: 1},
          ]}
          showsVerticalScrollIndicator={false}
        >
          {alarms.length === 0 ? (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8}}>
              <Text style={{fontSize: 48}}>⏰</Text>
              <Text variant="titleMedium" style={{color: theme.colors.onSurfaceVariant, fontWeight: '600'}}>
                No alarms set
              </Text>
              <Text variant="bodyMedium" style={{color: theme.colors.outline}}>
                Tap + to create your first alarm
              </Text>
              <Button mode="contained" onPress={() => navigation.navigate('AddAlarm')} style={{marginTop: 8}}>
                Create Alarm
              </Button>
            </View>
          ) : (
            alarms.map((alarm, index) => (
              <React.Fragment key={alarm.id}>
                {dropFullIdx === index && (
                  <View style={{height: 3, backgroundColor: theme.colors.primary, marginHorizontal: 16, marginBottom: 6, borderRadius: 2}} />
                )}
                <View
                  onLayout={(e) => {
                    itemLayoutsRef.current.set(alarm.id, {
                      y: e.nativeEvent.layout.y,
                      height: e.nativeEvent.layout.height,
                    });
                  }}
                >
                  <AlarmCard
                    alarm={alarm}
                    index={index}
                    onShowToast={showToast}
                    isDragging={alarm.id === draggingId}
                    dragCallbacksRef={dragCallbacksRef}
                  />
                </View>
              </React.Fragment>
            ))
          )}
          {dropFullIdx === alarms.length && (
            <View style={{height: 3, backgroundColor: theme.colors.primary, marginHorizontal: 16, marginTop: -6, borderRadius: 2}} />
          )}
        </ScrollView>
      </View>

      {/* Floating ghost card during drag */}
      {draggingAlarm && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: 0,
            transform: [{translateY: ghostAnimY}],
            zIndex: 999,
          }}
        >
          <GhostCard alarm={draggingAlarm} />
        </Animated.View>
      )}

      {/* Gradient FAB */}
      <Pressable
        onPress={() => navigation.navigate('AddAlarm')}
        style={{position: 'absolute', bottom: fabBottom, right: 24}}
        android_ripple={{color: 'rgba(255,255,255,0.25)', borderless: true, radius: 60}}>
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
      </Pressable>

      <TopToast message={toastMsg} visible={toastVisible} />
    </View>
  );
}
