import React, {useState, useRef, useEffect} from 'react';
import {Modal, View} from 'react-native';
import {Text, Button, useTheme} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND_GRADIENT, cardShadow} from '../theme';

const SYMBOLS = ['🍋', '🔔', '💎', '⭐', '7️⃣'];

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

  useEffect(() => {
    if (visible) {
      setPhase('idle');
      setReels(['🎰', '🎰', '🎰']);
      setOutcome(null);
    }
  }, [visible]);

  const spin = () => {
    const result = roll(wager);
    setOutcome(result);
    setPhase('spinning');

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
        if (i === 2) setTimeout(() => setPhase('result'), 400);
      }, delay);
    });
  };

  const won = outcome && outcome.payout > 0;
  const multiplier = wager > 0 && outcome ? outcome.payout / wager : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={phase === 'idle' ? onClose : undefined}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 28}}>
        <View style={[{backgroundColor: c.surface, borderRadius: 28, padding: 28, alignItems: 'center', width: '100%'}, dark ? {} : cardShadow]}>

          <Text style={{fontSize: 26, fontWeight: '900', color: c.onSurface, letterSpacing: -0.5, marginBottom: 4}}>
            Rep Slots 🎰
          </Text>
          <Text style={{fontSize: 14, color: c.onSurfaceVariant, marginBottom: 24}}>
            Wagering{' '}
            <Text style={{fontWeight: '800', color: c.primary}}>{wager} reps</Text>
          </Text>

          <View style={{flexDirection: 'row', gap: 10, marginBottom: 28, backgroundColor: c.surfaceVariant, borderRadius: 16, padding: 14}}>
            {reels.map((sym, i) => (
              <View key={i} style={{width: 72, height: 72, borderRadius: 12, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 38}}>{sym}</Text>
              </View>
            ))}
          </View>

          {phase === 'idle' && (
            <>
              <Text style={{fontSize: 12, color: c.onSurfaceVariant, textAlign: 'center', marginBottom: 20}}>
                2x → 7x jackpot. Lose it all. Your call.
              </Text>
              <Button mode="contained" onPress={spin} contentStyle={{paddingHorizontal: 40, paddingVertical: 10}}>
                SPIN 🎰
              </Button>
              <Button mode="text" textColor={c.onSurfaceVariant} onPress={onClose} style={{marginTop: 8}}>
                Nah, keep my reps
              </Button>
            </>
          )}

          {phase === 'spinning' && (
            <Text style={{fontSize: 15, color: c.onSurfaceVariant, fontWeight: '600', marginTop: 4}}>
              Spinning...
            </Text>
          )}

          {phase === 'result' && outcome && (
            <>
              {won ? (
                <>
                  {multiplier === 7 && (
                    <Text style={{fontSize: 20, fontWeight: '900', color: '#FFD700', marginBottom: 6}}>
                      🚨 JACKPOT 🚨
                    </Text>
                  )}
                  <LinearGradient
                    colors={BRAND_GRADIENT.colors}
                    start={BRAND_GRADIENT.start} end={BRAND_GRADIENT.end}
                    style={{borderRadius: 100, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 8}}>
                    <Text style={{fontSize: 20, fontWeight: '900', color: '#fff'}}>
                      {outcome.payout} reps! ({multiplier}x) 🎉
                    </Text>
                  </LinearGradient>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 20}}>
                    +{outcome.payout - wager} bonus reps
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{fontSize: 36, marginBottom: 8}}>💀</Text>
                  <Text style={{fontSize: 22, fontWeight: '900', color: c.error, marginBottom: 4}}>
                    Lost {wager} reps.
                  </Text>
                  <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 20}}>
                    Should've quit while you were ahead.
                  </Text>
                </>
              )}
              <Button
                mode="contained"
                onPress={() => { onResult(outcome.payout); onClose(); }}
                contentStyle={{paddingHorizontal: 40, paddingVertical: 8}}>
                {won ? 'Collect 💰' : 'Take the L'}
              </Button>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}
