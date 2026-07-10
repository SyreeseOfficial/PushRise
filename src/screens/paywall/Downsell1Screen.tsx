import React, {useEffect, useRef, useState} from 'react';
import {View, Alert} from 'react-native';
import {Text, Button, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../navigation/navigationRef';
import {useSubscriptionStore} from '../../store/subscriptionStore';

type Nav = StackNavigationProp<RootStackParamList>;

const COUNTDOWN_SECONDS = 15 * 60; // 15 minutes

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function Downsell1Screen() {
  const {colors: c} = useTheme();
  const navigation = useNavigation<Nav>();
  const {downsell1SeenAt, markDownsell1Seen} = useSubscriptionStore();

  const startedAt = useRef(downsell1SeenAt ?? Date.now());
  const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
  const [remaining, setRemaining] = useState(Math.max(0, COUNTDOWN_SECONDS - elapsed));

  useEffect(() => {
    if (!downsell1SeenAt) markDownsell1Seen();
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const handleBuy = () => {
    // ponytail: wire to RevenueCat discounted offering once configured in dashboard
    Alert.alert('Discounted Purchase', 'RevenueCat discounted offering coming soon.');
  };

  const handleDecline = () => {
    navigation.replace('Downsell2');
  };

  const expired = remaining === 0;

  return (
    <View style={{flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 24}}>
      <Text style={{fontSize: 48}}>⏰</Text>

      {!expired ? (
        <>
          <Text style={{fontSize: 13, fontWeight: '700', color: c.primary, textTransform: 'uppercase', letterSpacing: 1}}>
            Limited-time offer
          </Text>
          <Text style={{fontSize: 72, fontWeight: '900', color: c.primary, letterSpacing: -2, lineHeight: 76}}>
            {formatTime(remaining)}
          </Text>
        </>
      ) : (
        <Text style={{fontSize: 15, fontWeight: '700', color: c.error, textAlign: 'center'}}>
          Offer expired.
        </Text>
      )}

      <Text style={{fontSize: 28, fontWeight: '800', color: c.onBackground, textAlign: 'center', letterSpacing: -0.5}}>
        Get PushRise Pro{'\n'}at 50% off
      </Text>
      <Text style={{fontSize: 15, color: c.onSurfaceVariant, textAlign: 'center', lineHeight: 24}}>
        {expired
          ? 'This offer has ended.'
          : 'One-time offer. This price disappears when the timer hits zero.'}
      </Text>

      <View style={{width: '100%', gap: 8, marginTop: 8}}>
        <Text style={{fontSize: 11, color: c.onSurfaceVariant, textAlign: 'center', marginBottom: 4}}>
          ~~$2.99/mo~~ → <Text style={{color: c.primary, fontWeight: '800'}}>$1.49/mo</Text>{'   '}
          ~~$14.99~~ → <Text style={{color: c.primary, fontWeight: '800'}}>$7.99 lifetime</Text>
        </Text>
        <Button
          mode="contained"
          onPress={handleBuy}
          disabled={expired}
          contentStyle={{paddingVertical: 10}}
          style={{borderRadius: 16}}>
          {expired ? 'Offer Expired' : 'Claim 50% Off'}
        </Button>
        <Button mode="text" textColor={c.onSurfaceVariant} onPress={handleDecline}>
          No thanks
        </Button>
      </View>
    </View>
  );
}
