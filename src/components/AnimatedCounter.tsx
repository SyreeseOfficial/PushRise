import React, {useEffect, useRef} from 'react';
import {Animated, StyleProp, TextStyle} from 'react-native';

export default function AnimatedCounter({value, style}: {value: number; style?: StyleProp<TextStyle>}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    scale.setValue(1.35);
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, tension: 200, friction: 8}).start();
  }, [value, scale]);

  return (
    <Animated.Text style={[style, {transform: [{scale}]}]}>
      {value}
    </Animated.Text>
  );
}
