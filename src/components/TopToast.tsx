import React, {useEffect, useRef} from 'react';
import {Animated, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'react-native-paper';

export default function TopToast({message, visible}: {message: string; visible: boolean}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {toValue: 0, useNativeDriver: true, tension: 65, friction: 10}),
        Animated.timing(opacity, {toValue: 1, duration: 180, useNativeDriver: true}),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {toValue: -80, duration: 220, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        transform: [{translateY}],
        opacity,
        zIndex: 9999,
      }}>
      <View style={{
        backgroundColor: theme.colors.inverseSurface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <Text style={{fontSize: 14, fontWeight: '600', color: theme.colors.inverseOnSurface}}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
