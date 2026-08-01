import React, {useState, useRef, useEffect} from 'react';
import {Modal, View, Animated, Dimensions, Vibration} from 'react-native';
import {Text, Button, useTheme} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import {BRAND_GRADIENT, cardShadow} from '../theme';

const SYMBOLS = ['🍋', '🔔', '💎', '⭐', '7️⃣'];
const {width} = Dimensions.get('window');

type RollResult = {payout: number; symbols: [string, string, string]; stopSequence: [number, number, number]};

const ROLLS: Array<[number, RollResult]> = [
  [0.02, {payout: 7, symbols: ['7️⃣', '7️⃣', '7️⃣'], stopSequence: [800, 1200, 1600]}],
  [0.07, {payout: 5, symbols: ['💎', '💎', '💎'],    stopSequence: [750, 1150, 1550]}],
  [0.17, {payout: 3, symbols: ['⭐', '⭐', '⭐'],    stopSequence: [700, 1100, 1500]}],
  [0.37, {payout: 2, symbols: ['🔔', '🔔', '🔔'],    stopSequence: [650, 1050, 1450]}],
  [1.00, {payout: 0, symbols: ['🍋', '🔔', '💎'],    stopSequence: [900, 1300, 1700]}],
];

function roll(wager: number): RollResult {
  const r = Math.random();
  const [, {payout, symbols, stopSequence}] = ROLLS.find(([t]) => r < t)!;
  return {payout: payout * wager, symbols, stopSequence};
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
  const [outcome, setOutcome] = useState<{payout: number; symbols: [string, string, string]; stopSequence: [number, number, number]} | null>(null);
  const ivals = useRef<(ReturnType<typeof setInterval> | null)[]>([null, null, null]);
  const lockedReels = useRef<boolean[]>([false, false, false]);
  const confettiRef = useRef<any>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const skullScale = useRef(new Animated.Value(0)).current;
  const reelScale = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const spinButtonScale = useRef(new Animated.Value(1)).current;
  const headerShake = useRef(new Animated.Value(0)).current;
  // ponytail: useEffect dependencies include all animated values to avoid stale closures
  useEffect(() => {
    if (visible) {
      setPhase('idle');
      setReels(['🎰', '🎰', '🎰']);
      setOutcome(null);
      lockedReels.current = [false, false, false];
      shakeAnim.setValue(0);
      skullScale.setValue(0);
      reelScale.setValue(1);
      resultScale.setValue(0);
      spinButtonScale.setValue(1);
      headerShake.setValue(0);
    }
  }, [visible, shakeAnim, skullScale, reelScale, resultScale, spinButtonScale, headerShake]);

  const stopPulse = () => {
    pulseLoop.current?.stop();
    reelScale.setValue(1);
  };

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(reelScale, {toValue: 1.08, duration: 200, useNativeDriver: true}),
        Animated.timing(reelScale, {toValue: 1, duration: 200, useNativeDriver: true}),
      ])
    );
    pulseLoop.current.start();
  };

  const animateSpinButton = () => {
    Animated.sequence([
      Animated.spring(spinButtonScale, {toValue: 0.92, useNativeDriver: true, tension: 100, friction: 5}),
      Animated.spring(spinButtonScale, {toValue: 1.05, useNativeDriver: true, tension: 100, friction: 5}),
      Animated.spring(spinButtonScale, {toValue: 1, useNativeDriver: true, tension: 80, friction: 8}),
    ]).start();
  };

  const showResult = (result: {payout: number; symbols: [string, string, string]; stopSequence: [number, number, number]}) => {
    stopPulse();
    setPhase('result');
    Vibration.vibrate([50, 100, 50, 100, 50]);
    Animated.spring(resultScale, {toValue: 1, useNativeDriver: true, tension: 220, friction: 6}).start();

    if (result.payout > 0) {
      Animated.timing(headerShake, {
        toValue: 0, useNativeDriver: true, duration: 500,
      }).start();
      setTimeout(() => confettiRef.current?.start(), 100);
      if (result.payout >= wager * 7) {
        Vibration.vibrate([100, 50, 100, 50, 100]);
      }
    } else {
      Animated.sequence([
        ...Array(6).fill(null).flatMap((_, i) => [
          Animated.timing(shakeAnim, {toValue: i % 2 === 0 ? 16 : -16, duration: 50, useNativeDriver: true}),
        ]),
        Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
      ]).start();
      Animated.spring(skullScale, {toValue: 1, useNativeDriver: true, tension: 250, friction: 4}).start();
    }
  };

  const spin = () => {
    const result = roll(wager);
    setOutcome(result);
    setPhase('spinning');
    skullScale.setValue(0);
    resultScale.setValue(0);
    Vibration.vibrate([30, 50, 30]);
    startPulse();

    lockedReels.current = [false, false, false];
    // ponytail: one interval, one setState/tick (was 3×50ms intervals = ~60 updates/sec)
    ivals.current[0] = setInterval(() => {
      setReels(prev => [
        lockedReels.current[0] ? prev[0] : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        lockedReels.current[1] ? prev[1] : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        lockedReels.current[2] ? prev[2] : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 100);
    Vibration.vibrate(20);

    result.stopSequence.forEach((delay, i) => {
      setTimeout(() => {
        Vibration.vibrate(100);
        lockedReels.current[i] = true;
        setReels(prev => {
          const next = [...prev] as [string, string, string];
          next[i] = result.symbols[i];
          return next;
        });
        if (i === 2) {
          clearInterval(ivals.current[0]!);
          setTimeout(() => showResult(result), 500);
        }
      }, delay);
    });
  };

  const won = outcome && outcome.payout > 0;
  const multiplier = wager > 0 && outcome ? outcome.payout / wager : 0;
  const isJackpot = multiplier === 7;

  const reelBg = (_i: number): [string, string] => {
    if (phase === 'result' && won) return BRAND_GRADIENT.colors as [string, string];
    if (phase === 'spinning') return ['#1a1a2e', '#16213e'];
    return [c.surface, c.surface];
  };

  const handleSpin = () => {
    animateSpinButton();
    spin();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={phase === 'idle' ? onClose : undefined}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 20}}>

        <ConfettiCannon
          ref={confettiRef}
          count={280}
          origin={{x: width / 2, y: -50}}
          autoStart={false}
          fadeOut
          explosionSpeed={420}
          fallSpeed={2500}
        />

        <Animated.View style={[
          {width: '100%', alignItems: 'center'},
          {transform: [{translateX: headerShake}]},
        ]}>
          <Text style={{fontSize: 20, fontWeight: '700', color: c.primary, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase'}}>
            ⭐ LUCKY SPIN ⭐
          </Text>
        </Animated.View>

        <Animated.View style={[
          {backgroundColor: c.surface, borderRadius: 40, padding: 32, alignItems: 'center', width: '100%'},
          dark ? {} : cardShadow,
          {transform: [{translateX: shakeAnim}]},
        ]}>

          <Text style={{fontSize: 26, fontWeight: '900', color: c.onSurface, letterSpacing: -0.5, marginBottom: 2}}>
            All in on {wager} reps! 🎰
          </Text>
          <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 28, fontWeight: '500'}}>
            Win up to <Text style={{fontWeight: '900', color: c.primary}}>{wager * 7}x</Text> or lose it all
          </Text>

          {/* Reels with glass effect */}
          <View style={{
            borderRadius: 28, overflow: 'hidden', marginBottom: 32,
            borderWidth: 3, borderColor: c.primaryContainer,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}>
            <Animated.View style={{
              flexDirection: 'row', gap: 8,
              padding: 12,
              transform: [{scale: reelScale}],
            }}>
              {reels.map((sym, i) => (
                <View key={i} style={{
                  width: 90, height: 100, borderRadius: 18,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: phase === 'spinning' && i === reels.length - 1 ? c.primary : c.outlineVariant,
                }}>
                  <LinearGradient
                    colors={reelBg(i)}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{fontSize: 48, fontWeight: '900'}}>{sym}</Text>
                  </LinearGradient>
                </View>
              ))}
            </Animated.View>
          </View>

          {phase === 'idle' && (
            <>
              <View style={{flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center'}}>
                <View style={{
                  backgroundColor: c.errorContainer, borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: c.error,
                }}>
                  <Text style={{fontSize: 13, fontWeight: '900', color: c.error}}>🎰 7x JACKPOT</Text>
                </View>
                <View style={{backgroundColor: c.primaryContainer, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8}}>
                  <Text style={{fontSize: 12, fontWeight: '800', color: c.primary}}>Max: 5x 💎</Text>
                </View>
              </View>
              <Animated.View style={{width: '100%', transform: [{scale: spinButtonScale}]}}>
                <LinearGradient
                  {...BRAND_GRADIENT}
                  style={{
                    borderRadius: 20, marginBottom: 14, width: '100%',
                    shadowColor: BRAND_GRADIENT.colors[0], shadowOffset: {width: 0, height: 8},
                    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
                  }}>
                  <Button mode="text" onPress={handleSpin} textColor="#fff" contentStyle={{paddingVertical: 16}}>
                    <Text style={{fontSize: 18, fontWeight: '900', letterSpacing: 0.5}}>🎰 SPIN IT 🎰</Text>
                  </Button>
                </LinearGradient>
              </Animated.View>
              <Button mode="text" textColor={c.onSurfaceVariant} onPress={onClose} contentStyle={{paddingVertical: 4}}>
                Keep my reps safe
              </Button>
            </>
          )}

          {phase === 'spinning' && (
            <View style={{alignItems: 'center', marginVertical: 8}}>
              <Text style={{fontSize: 20, fontWeight: '900', color: c.primary, marginBottom: 8}}>
                🤞 Come on! 🤞
              </Text>
              <Text style={{fontSize: 48}}>⏳</Text>
            </View>
          )}

          {phase === 'result' && outcome && (
            <Animated.View style={{alignItems: 'center', width: '100%', transform: [{scale: resultScale}]}}>
              {won ? (
                <>
                  {isJackpot && (
                    <>
                      <Text style={{fontSize: 28, fontWeight: '900', color: '#FFD700', marginBottom: 4, letterSpacing: 2}}>
                        🚨 JACKPOT!! 🚨
                      </Text>
                      <Text style={{fontSize: 14, color: '#FFD700', marginBottom: 14, fontWeight: '700'}}>
                        YOU HIT THE 7️⃣ 7️⃣ 7️⃣
                      </Text>
                    </>
                  )}
                  <View style={{marginBottom: 8}}>
                    <LinearGradient
                      colors={BRAND_GRADIENT.colors}
                      start={BRAND_GRADIENT.start}
                      end={BRAND_GRADIENT.end}
                      style={{
                        borderRadius: 24, paddingHorizontal: 28, paddingVertical: 16,
                        alignItems: 'center',
                      }}>
                      <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 0.5}}>
                        YOU WON
                      </Text>
                      <Text style={{fontSize: 40, fontWeight: '900', color: '#fff', marginTop: 4}}>
                        +{outcome.payout} 💪
                      </Text>
                      <Text style={{fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2}}>
                        {multiplier}x multiplier
                      </Text>
                    </LinearGradient>
                  </View>
                  <Text style={{fontSize: 12, color: c.primary, marginBottom: 24, fontWeight: '700'}}>
                    +{outcome.payout - wager} bonus reps in the bank 🏦
                  </Text>
                </>
              ) : (
                <>
                  <Animated.Text style={{fontSize: 72, marginBottom: 12, marginTop: 8, transform: [{scale: skullScale}]}}>
                    💀
                  </Animated.Text>
                  <Text style={{fontSize: 26, fontWeight: '900', color: c.error, marginBottom: 6}}>
                    HOUSE WINS
                  </Text>
                  <Text style={{fontSize: 18, fontWeight: '900', color: c.error, marginBottom: 4}}>
                    -{wager} reps gone
                  </Text>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 24}}>
                    Better luck next time 😈 That's the gamble!
                  </Text>
                </>
              )}
              <LinearGradient
                colors={won ? BRAND_GRADIENT.colors : ['#333333', '#1a1a1a']}
                start={BRAND_GRADIENT.start}
                end={BRAND_GRADIENT.end}
                style={{width: '100%', borderRadius: 16}}>
                <Button
                  mode="text"
                  onPress={() => {onResult(outcome.payout); onClose();}}
                  textColor="#fff"
                  contentStyle={{paddingVertical: 12}}>
                  <Text style={{fontSize: 16, fontWeight: '900'}}>
                    {won ? 'COLLECT 💰' : 'MOVE ON'}
                  </Text>
                </Button>
              </LinearGradient>
            </Animated.View>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}
