import React, {useEffect, useRef} from 'react';
import {Modal, View, Text, Animated, TouchableOpacity} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useBankStore} from '../store/bankStore';
import {BRAND_GRADIENT} from '../theme';

export default function LevelUpModal() {
  const pendingLevelUp = useBankStore(s => s.pendingLevelUp);
  const clearLevelUp = useBankStore(s => s.clearLevelUp);
  const insets = useSafeAreaInsets();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const oldEmojiOpacity = useRef(new Animated.Value(0)).current;
  const oldEmojiScale = useRef(new Animated.Value(1)).current;
  const newEmojiScale = useRef(new Animated.Value(0.3)).current;
  const newEmojiOpacity = useRef(new Animated.Value(0)).current;
  const labelTranslate = useRef(new Animated.Value(24)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (!pendingLevelUp) return;

    overlayOpacity.setValue(0);
    oldEmojiOpacity.setValue(0);
    oldEmojiScale.setValue(1);
    newEmojiScale.setValue(0.3);
    newEmojiOpacity.setValue(0);
    labelTranslate.setValue(24);
    labelOpacity.setValue(0);
    buttonsOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(overlayOpacity, {toValue: 1, duration: 350, useNativeDriver: true}),
      Animated.timing(oldEmojiOpacity, {toValue: 1, duration: 250, useNativeDriver: true}),
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(oldEmojiOpacity, {toValue: 0, duration: 350, useNativeDriver: true}),
        Animated.timing(oldEmojiScale, {toValue: 0.4, duration: 350, useNativeDriver: true}),
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.spring(newEmojiScale, {toValue: 1, tension: 70, friction: 5, useNativeDriver: true}),
            Animated.timing(newEmojiOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
          ]),
        ]),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(labelTranslate, {toValue: 0, duration: 320, useNativeDriver: true}),
        Animated.timing(labelOpacity, {toValue: 1, duration: 320, useNativeDriver: true}),
      ]),
      Animated.timing(buttonsOpacity, {toValue: 1, duration: 280, useNativeDriver: true}),
    ]).start(() => confettiRef.current?.start());
  }, [pendingLevelUp]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pendingLevelUp) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={clearLevelUp} statusBarTranslucent>
      <Animated.View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', alignItems: 'center', justifyContent: 'center', opacity: overlayOpacity}}>

        {/* Emoji zone — both stacked absolutely so they occupy the same space */}
        <View style={{width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 32}}>
          <Animated.Text style={{position: 'absolute', fontSize: 100, opacity: oldEmojiOpacity, transform: [{scale: oldEmojiScale}]}}>
            {pendingLevelUp.fromEmoji}
          </Animated.Text>
          <Animated.Text style={{position: 'absolute', fontSize: 100, opacity: newEmojiOpacity, transform: [{scale: newEmojiScale}]}}>
            {pendingLevelUp.toEmoji}
          </Animated.Text>
        </View>

        {/* Level + title */}
        <Animated.View style={{alignItems: 'center', opacity: labelOpacity, transform: [{translateY: labelTranslate}]}}>
          <Text style={{fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 58}}>
            LEVEL {pendingLevelUp.toLevel}
          </Text>
          <LinearGradient
            colors={BRAND_GRADIENT.colors}
            start={BRAND_GRADIENT.start}
            end={BRAND_GRADIENT.end}
            style={{borderRadius: 100, paddingHorizontal: 22, paddingVertical: 9, marginTop: 12}}>
            <Text style={{fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 1.5}}>
              {pendingLevelUp.toLabel.toUpperCase()}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Bottom actions */}
        <Animated.View style={{
          position: 'absolute',
          bottom: insets.bottom + 40,
          alignItems: 'center',
          gap: 14,
          opacity: buttonsOpacity,
        }}>
          <Text style={{color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 0.5, fontWeight: '600'}}>
            ✦  SCREENSHOT TO SHARE  ✦
          </Text>
          <TouchableOpacity
            onPress={clearLevelUp}
            activeOpacity={0.85}
            style={{backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 44, paddingVertical: 15}}>
            <Text style={{fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: -0.3}}>
              Let's gooo 💪
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ConfettiCannon
          ref={confettiRef}
          count={140}
          origin={{x: 200, y: -20}}
          autoStart={false}
          fadeOut
        />
      </Animated.View>
    </Modal>
  );
}
