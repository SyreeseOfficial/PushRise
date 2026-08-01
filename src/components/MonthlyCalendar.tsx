import React, {useState, useRef, useCallback} from 'react';
import {
  View, Animated, PanResponder, TouchableOpacity, Text, Modal, TouchableWithoutFeedback,
} from 'react-native';
import {useTheme, IconButton} from 'react-native-paper';
import {cardShadow} from '../theme';

interface Props {
  dailyHistory: Record<string, number>;
}

export default function MonthlyCalendar({dailyHistory}: Props) {
  const theme = useTheme();
  const c = theme.colors;

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const [viewMonth, setViewMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const slideX = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.9)).current;

  const toKey = useCallback((day: number) =>
    `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    [viewMonth]);

  const firstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({length: daysInMonth}, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ];

  const changeMonth = (dir: 1 | -1) => {
    Animated.timing(slideX, {
      toValue: dir * -300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSelectedDate(null);
      popupScale.setValue(0.9);
      setViewMonth(m => {
        let month = m.month + dir;
        let year = m.year;
        if (month > 11) {month = 0; year++;}
        if (month < 0) {month = 11; year--;}
        return {year, month};
      });
      slideX.setValue(dir * 300);
      Animated.timing(slideX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const swipePan = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) =>
      Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 5,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) < 50) return;
      const dir = g.dx < 0 ? 1 : -1;
      changeMonth(dir);
    },
  })).current;

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1)
    .toLocaleDateString('en-US', {month: 'long', year: 'numeric'});

  const renderCell = useCallback((day: number | null, idx: number) => {
    if (day === null) {
      return (
        <View key={idx} style={{width: '14.285714%', aspectRatio: 1}} />
      );
    }

    const key = toKey(day);
    const reps = dailyHistory[key] ?? 0;
    const completed = reps > 0;
    const isSelected = key === selectedDate;
    const isToday = key === todayKey;

    return (
      <TouchableOpacity
        key={idx}
        onPress={() => {
          if (!completed) return;
          if (isSelected) {
            popupScale.setValue(0.9);
            setSelectedDate(null);
          } else {
            setSelectedDate(key);
            Animated.spring(popupScale, {
              toValue: 1,
              speed: 12,
              bounciness: 8,
              useNativeDriver: true,
            }).start();
          }
        }}
        disabled={!completed}
        style={{
          width: '14.285714%',
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: completed ? c.primary : isToday ? c.primaryContainer : 'transparent',
          borderWidth: !completed && !isToday ? 1 : 0,
          borderColor: c.outlineVariant,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: completed ? '700' : '400',
            color: completed ? '#FFFFFF' : c.onSurfaceVariant,
          }}>
            {day}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [viewMonth, selectedDate, dailyHistory, c, toKey, popupScale, todayKey]);

  return (
    <View style={[{backgroundColor: c.surface, borderRadius: 20, padding: 16}, theme.dark ? {} : cardShadow]}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
        <IconButton icon="chevron-left" size={20} onPress={() => changeMonth(-1)} style={{margin: 0}} iconColor={c.onSurface} />
        <Text style={{fontSize: 15, fontWeight: '700', color: c.onSurface}}>{monthLabel}</Text>
        <IconButton icon="chevron-right" size={20} onPress={() => changeMonth(1)} style={{margin: 0}} iconColor={c.onSurface} />
      </View>

      <Animated.View
        style={{transform: [{translateX: slideX}]}}
        {...swipePan.panHandlers}
      >
        {/* Day of week header */}
        <View style={{flexDirection: 'row', marginBottom: 4}}>
          {['S', 'M', 'Tu', 'W', 'Th', 'F', 'S'].map((d, i) => (
            <Text
              key={i}
              style={{
                width: '14.285714%',
                textAlign: 'center',
                fontSize: 11,
                color: c.onSurfaceVariant,
                fontWeight: '600',
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {cells.map((day, idx) => renderCell(day, idx))}
        </View>
      </Animated.View>

      <Modal
        visible={!!selectedDate && (dailyHistory[selectedDate] ?? 0) > 0}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          popupScale.setValue(0.9);
          setSelectedDate(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          popupScale.setValue(0.9);
          setSelectedDate(null);
        }}>
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
            <Animated.View
              style={{
                backgroundColor: c.surfaceVariant,
                borderRadius: 16,
                padding: 24,
                transform: [{scale: popupScale}],
              }}
            >
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: c.onSurface,
              }}>
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }) : ''}
              </Text>
              <Text style={{
                fontSize: 13,
                color: c.onSurfaceVariant,
                marginTop: 4,
              }}>
                {selectedDate ? dailyHistory[selectedDate] : 0} push-ups completed
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
