import React from 'react';
import {View, Alert} from 'react-native';
import {Text, Button, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useSubscriptionStore} from '../../store/subscriptionStore';

export default function Downsell2Screen() {
  const {colors: c} = useTheme();
  const navigation = useNavigation();
  const {hasUsedExtension, applyExtension} = useSubscriptionStore();

  const handleExtend = () => {
    if (hasUsedExtension) {
      Alert.alert('Already used', "You've already claimed your free extension.");
      return;
    }
    applyExtension();
    navigation.goBack();
  };

  return (
    <View style={{flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 24}}>
      <Text style={{fontSize: 48}}>🎁</Text>
      <Text style={{fontSize: 28, fontWeight: '800', color: c.onBackground, textAlign: 'center', letterSpacing: -0.5}}>
        One more chance.
      </Text>
      <Text style={{fontSize: 15, color: c.onSurfaceVariant, textAlign: 'center', lineHeight: 24}}>
        {hasUsedExtension
          ? "You've already used your free extension. Upgrade to keep going."
          : "We'll give you 3 more days free — no strings. After that, it's $2.99/mo or $14.99 lifetime."}
      </Text>

      <View style={{width: '100%', gap: 8, marginTop: 8}}>
        <Button
          mode="contained"
          onPress={handleExtend}
          disabled={hasUsedExtension}
          contentStyle={{paddingVertical: 10}}
          style={{borderRadius: 16}}>
          {hasUsedExtension ? 'Extension Already Used' : 'Give me 3 more days'}
        </Button>
        <Button mode="text" textColor={c.onSurfaceVariant} onPress={() => navigation.goBack()}>
          No thanks
        </Button>
      </View>
    </View>
  );
}
