import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Progress</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTxt}>Coming soon</Text>
        <Text style={styles.placeholderSub}>Push-up stats and streaks</Text>
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
