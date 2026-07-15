import React, {useRef, useState, useEffect} from 'react';
import {View, Animated, Pressable} from 'react-native';
import {Icon} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

const ICONS: Record<string, string> = {
  Alarms: 'alarm',
  Progress: 'trending-up',
  Rewards: 'gift',
};

export default function CustomTabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(pillX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 11,
    }).start();
  }, [state.index, tabWidth]);

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
          backgroundColor: 'rgba(18, 18, 18, 0.92)',
          borderRadius: 100,
          padding: 6,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: 0.35,
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
              backgroundColor: '#ffffff',
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
                if (!focused) navigation.navigate(route.name);
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
              }}>
              <Icon
                source={ICONS[route.name] ?? 'circle'}
                color={focused ? '#111111' : 'rgba(255,255,255,0.65)'}
                size={22}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
