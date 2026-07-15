import React, {useRef, useState, useEffect} from 'react';
import {View, Animated, Pressable, Vibration} from 'react-native';
import {Icon, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

const ICONS: Record<string, string> = {
  Alarms: 'alarm',
  Progress: 'trending-up',
  Rewards: 'gift',
};

export default function CustomTabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.dark;
  const [tabWidth, setTabWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;
  // ponytail: stable ref — routes don't change at runtime
  const iconScales = useRef(state.routes.map(() => new Animated.Value(1))).current;

  const barBg = isDark ? 'rgba(28,28,30,0.94)' : 'rgba(255,255,255,0.95)';
  const barBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const pillColor = theme.colors.primary;
  const iconFocused = isDark ? '#000000' : '#FFFFFF';
  const iconUnfocused = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.40)';

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(pillX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 11,
    }).start();
  }, [state.index, tabWidth]);

  // #3 — pop active icon whenever the active tab changes
  useEffect(() => {
    Animated.sequence([
      Animated.spring(iconScales[state.index], {toValue: 1.25, useNativeDriver: true, speed: 30, bounciness: 14}),
      Animated.spring(iconScales[state.index], {toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6}),
    ]).start();
  }, [state.index]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, 8) + 12,
        left: 32,
        right: 32,
      }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: barBg,
          borderRadius: 100,
          padding: 6,
          borderWidth: 1,
          borderColor: barBorder,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 16,
        }}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          setTabWidth((w - 12) / state.routes.length);
        }}>
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
              left: 6,
              width: tabWidth,
              backgroundColor: pillColor,
              borderRadius: 100,
              transform: [{translateX: pillX}],
            }}
          />
        )}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                // #2 — haptic tick
                Vibration.vibrate(30);
                // #1 — bounce scale
                Animated.sequence([
                  Animated.spring(iconScales[i], {toValue: 1.3, useNativeDriver: true, speed: 28, bounciness: 16}),
                  Animated.spring(iconScales[i], {toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6}),
                ]).start();
                if (!focused) navigation.navigate(route.name);
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
              }}>
              <Animated.View style={{transform: [{scale: iconScales[i]}]}}>
                <Icon
                  source={ICONS[route.name] ?? 'circle'}
                  color={focused ? iconFocused : iconUnfocused}
                  size={22}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
