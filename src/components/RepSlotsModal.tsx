import React, {useState, useRef, useEffect} from 'react';
import {Modal, View, Animated, Dimensions} from 'react-native';
import {Text, Button, useTheme} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import {BRAND_GRADIENT, cardShadow} from '../theme';

const SYMBOLS = ['🍋', '🔔', '💎', '⭐', '7️⃣'];
const {width} = Dimensions.get('window');

function roll(wager: number): {payout: number; symbols: [string, string, string]} {
  const r = Math.random();
  if (r < 0.02) return {payout: wager * 7, symbols: ['7️⃣', '7️⃣', '7️⃣']};
  if (r < 0.07) return {payout: wager * 5, symbols: ['💎', '💎', '💎']};
  if (r < 0.17) return {payout: wager * 3, symbols: ['⭐', '⭐', '⭐']};
  if (r < 0.37) return {payout: wager * 2, symbols: ['🔔', '🔔', '🔔']};
  return {payout: 0, symbols: ['🍋', '🔔', '💎']};
}

interface Props {
  visible: boolean;
  wager: number;
  onResult: (payout: number) => void;
  onClose: () => void;
}

export default function RepSlotsModal({visible, wager, onResult, onClose}: Props) {
  const {colors: c, dark} = useTheme();
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [reels, setReels] = useState<[string, string, string]>(['🎰', '🎰', '🎰']);
  const [outcome, setOutcome] = useState<{payout: number; symbols: [string, string, string]} | null>(null);
  const ivals = useRef<(ReturnType<typeof setInterval> | null)[]>([null, null, null]);
  const confettiRef = useRef<any>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const skullScale = useRef(new Animated.Value(0)).current;
  const reelScale = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      setPhase('idle');
      setReels(['🎰', '🎰', '🎰']);
      setOutcome(null);
      shakeAnim.setValue(0);
      skullScale.setValue(0);
      reelScale.setValue(1);
      resultScale.setValue(0);
    }
  }, [visible]);

  const stopPulse = () => {
    pulseLoop.current?.stop();
    reelScale.setValue(1);
  };

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(reelScale, {toValue: 1.05, duration: 280, useNativeDriver: true}),
        Animated.timing(reelScale, {toValue: 1, duration: 280, useNativeDriver: true}),
      ])
    );
    pulseLoop.current.start();
  };

  const showResult = (result: {payout: number; symbols: [string, string, string]}) => {
    stopPulse();
    setPhase('result');
    Animated.spring(resultScale, {toValue: 1, useNativeDriver: true, tension: 200, friction: 7}).start();

    if (result.payout > 0) {
      setTimeout(() => confettiRef.current?.start(), 150);
    } else {
      // shake the card + bounce skull in
      Animated.sequence([
        ...Array(5).fill(null).flatMap((_, i) => [
          Animated.timing(shakeAnim, {toValue: i % 2 === 0 ? 14 : -14, duration: 55, useNativeDriver: true}),
        ]),
        Animated.timing(shakeAnim, {toValue: 0, duration: 55, useNativeDriver: true}),
      ]).start();
      Animated.spring(skullScale, {toValue: 1, useNativeDriver: true, tension: 220, friction: 5}).start();
    }
  };

  const spin = () => {
    const result = roll(wager);
    setOutcome(result);
    setPhase('spinning');
    skullScale.setValue(0);
    resultScale.setValue(0);
    startPulse();

    [0, 1, 2].forEach(i => {
      ivals.current[i] = setInterval(() => {
        setReels(prev => {
          const next = [...prev] as [string, string, string];
          next[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return next;
        });
      }, 80);
    });

    [1200, 1600, 2000].forEach((delay, i) => {
      setTimeout(() => {
        clearInterval(ivals.current[i]!);
        setReels(prev => {
          const next = [...prev] as [string, string, string];
          next[i] = result.symbols[i];
          return next;
        });
        if (i === 2) setTimeout(() => showResult(result), 400);
      }, delay);
    });
  };

  const won = outcome && outcome.payout > 0;
  const multiplier = wager > 0 && outcome ? outcome.payout / wager : 0;
  const isJackpot = multiplier === 7;

  const reelBg = (i: number): [string, string] => {
    if (phase === 'result' && won) return BRAND_GRADIENT.colors as [string, string];
    if (phase === 'spinning') return ['#1a1a2e', '#16213e'];
    return [c.surface, c.surface];
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={phase === 'idle' ? onClose : undefined}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24}}>

        <ConfettiCannon
          ref={confettiRef}
          count={220}
          origin={{x: width / 2, y: 0}}
          autoStart={false}
          fadeOut
          explosionSpeed={350}
          fallSpeed={3000}
        />

        <Animated.View style={[
          {backgroundColor: c.surface, borderRadius: 32, padding: 28, alignItems: 'center', width: '100%'},
          dark ? {} : cardShadow,
          {transform: [{translateX: shakeAnim}]},
        ]}>

          <Text style={{fontSize: 28, fontWeight: '900', color: c.onSurface, letterSpacing: -0.5, marginBottom: 4}}>
            Place your bets! 🎰
          </Text>
          <Text style={{fontSize: 14, color: c.onSurfaceVariant, marginBottom: 24}}>
            Balance:{' '}
            <Text style={{fontWeight: '800', color: c.primary}}>{wager} reps</Text>
          </Text>

          {/* Reels */}
          <Animated.View style={{
            flexDirection: 'row', gap: 10, marginBottom: 28,
            backgroundColor: c.surfaceVariant, borderRadius: 22, padding: 16,
            transform: [{scale: reelScale}],
          }}>
            {reels.map((sym, i) => (
              <LinearGradient
                key={i}
                colors={reelBg(i)}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 42}}>{sym}</Text>
              </LinearGradient>
            ))}
          </Animated.View>

          {phase === 'idle' && (
            <>
              <View style={{flexDirection: 'row', gap: 6, marginBottom: 22, flexWrap: 'wrap', justifyContent: 'center'}}>
                {['2x', '3x', '5x', '🎰 7x JACKPOT'].map(m => (
                  <View key={m} style={{backgroundColor: c.primaryContainer, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5}}>
                    <Text style={{fontSize: 12, fontWeight: '800', color: c.primary}}>{m}</Text>
                  </View>
                ))}
              </View>
              <LinearGradient
                colors={BRAND_GRADIENT.colors}
                start={BRAND_GRADIENT.start}
                end={BRAND_GRADIENT.end}
                style={{borderRadius: 100, marginBottom: 10, width: '100%'}}>
                <Button mode="text" onPress={spin} textColor="#fff" contentStyle={{paddingVertical: 10}}>
                  SPIN 🎰
                </Button>
              </LinearGradient>
              <Button mode="text" textColor={c.onSurfaceVariant} onPress={onClose}>
                Nah, keep my reps
              </Button>
            </>
          )}

          {phase === 'spinning' && (
            <Text style={{fontSize: 16, color: c.onSurfaceVariant, fontWeight: '700', letterSpacing: 0.5}}>
              Come on... 🤞
            </Text>
          )}

          {phase === 'result' && outcome && (
            <Animated.View style={{alignItems: 'center', width: '100%', transform: [{scale: resultScale}]}}>
              {won ? (
                <>
                  {isJackpot && (
                    <Text style={{fontSize: 22, fontWeight: '900', color: '#FFD700', marginBottom: 8, letterSpacing: 1}}>
                      🚨 JACKPOT 🚨
                    </Text>
                  )}
                  <LinearGradient
                    colors={BRAND_GRADIENT.colors}
                    start={BRAND_GRADIENT.start}
                    end={BRAND_GRADIENT.end}
                    style={{borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 8}}>
                    <Text style={{fontSize: 22, fontWeight: '900', color: '#fff'}}>
                      +{outcome.payout} reps! ({multiplier}x) 🎉
                    </Text>
                  </LinearGradient>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 20}}>
                    +{outcome.payout - wager} bonus reps banked!
                  </Text>
                </>
              ) : (
                <>
                  <Animated.Text style={{fontSize: 56, marginBottom: 6, transform: [{scale: skullScale}]}}>
                    💀
                  </Animated.Text>
                  <Text style={{fontSize: 24, fontWeight: '900', color: c.error, marginBottom: 4}}>
                    -{wager} reps. Rekt.
                  </Text>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 20}}>
                    House always wins. 😈
                  </Text>
                </>
              )}
              <Button
                mode="contained"
                onPress={() => {onResult(outcome.payout); onClose();}}
                contentStyle={{paddingHorizontal: 40, paddingVertical: 8}}>
                {won ? 'Collect 💰' : 'Take the L'}
              </Button>
            </Animated.View>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}
