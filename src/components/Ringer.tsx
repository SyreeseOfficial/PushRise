import React from 'react';
import {Image, View, StyleSheet} from 'react-native';

type RingerState = 'cocky' | 'hype' | 'aggressive' | 'arms-crossed' | 'celebrating' | 'point-at-you' | 'tired' | 'disappointed' | 'default';
type RingerSize = 'small' | 'medium' | 'large';

const stateToImage: Record<RingerState, string> = {
  cocky: require('../assets/images/ringer/ringer-cocky.png'),
  hype: require('../assets/images/ringer/ringer-hype.png'),
  aggressive: require('../assets/images/ringer/ringer-aggresive.png'),
  'arms-crossed': require('../assets/images/ringer/ringer-arms-crossed.png'),
  celebrating: require('../assets/images/ringer/ringer-celebrating.png'),
  'point-at-you': require('../assets/images/ringer/ringer-point-at-you.png'),
  tired: require('../assets/images/ringer/ringer-tired.png'),
  disappointed: require('../assets/images/ringer/ringer-dissapointed.png'),
  default: require('../assets/images/ringer/ringer.png'),
};

const sizeToPixels: Record<RingerSize, number> = {
  small: 120,
  medium: 200,
  large: 280,
};

interface RingerProps {
  state?: RingerState;
  size?: RingerSize;
  style?: any;
}

export default function Ringer({state = 'default', size = 'medium', style}: RingerProps) {
  const pixels = sizeToPixels[size];
  const source = stateToImage[state];

  return (
    <View style={[styles.container, {width: pixels, height: pixels}, style]}>
      <Image
        source={source}
        style={{width: '100%', height: '100%'}}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
