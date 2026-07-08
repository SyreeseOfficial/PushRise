import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function RewardsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Rewards</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTxt}>Coming soon</Text>
        <Text style={styles.placeholderSub}>Bank push-ups, earn rewards</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  header: {fontSize: 32, fontWeight: '700', color: '#fff', padding: 20, paddingBottom: 8},
  placeholder: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  placeholderTxt: {fontSize: 18, color: '#333', fontWeight: '600'},
  placeholderSub: {fontSize: 14, color: '#222', marginTop: 8},
});
