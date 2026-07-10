import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;

export default function PaywallScreen() {
  const navigation = useNavigation<Nav>();

  const onSuccess = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const onDismiss = () => {
    // ponytail: placeholder — navigate to Downsell1 once that screen exists
    navigation.replace('Downsell1');
  };

  return (
    <View style={{flex: 1}}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={onSuccess}
        onRestoreCompleted={onSuccess}
        onPurchaseCancelled={onDismiss}
        onDismiss={onDismiss}
      />
    </View>
  );
}
