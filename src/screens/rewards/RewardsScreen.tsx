import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Animated, Dimensions, FlatList, View, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, Pressable} from 'react-native';
import {Text, Button, TextInput, TouchableRipple, Switch, Snackbar, Icon, IconButton, useTheme, Portal, Dialog} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../navigation/navigationRef';

import {useBankStore, Reward} from '../../store/bankStore';
import {BRAND_GRADIENT, cardShadow} from '../../theme';
import RepSlotsModal from '../../components/RepSlotsModal';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const EMOJIS = [
  '🏆','🎁','🎉','⭐','📺','🎮',
  '🎬','🎵','🎧','🍕','🍔','🍰',
  '☕','👕','👟','🎒','💵','💪',
];

interface FormState {
  emoji: string;
  customEmoji: string;
  title: string;
  cost: string;
  oneTime: boolean;
}

const EMPTY_FORM: FormState = {emoji: '🏆', customEmoji: '', title: '', cost: '', oneTime: false};

function RewardModal({visible, initial, modalTitle, onSave, onClose}: {
  visible: boolean;
  initial?: Reward;
  modalTitle: string;
  onSave: (data: Omit<Reward, 'id'>) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (visible) {
      setForm({
        emoji: initial?.emoji ?? '🏆',
        customEmoji: '',
        title: initial?.title ?? '',
        cost: initial?.cost?.toString() ?? '',
        oneTime: initial?.oneTime ?? false,
      });
    }
  }, [visible, initial]);

  const save = () => {
    const cost = parseInt(form.cost, 10);
    if (!form.title.trim() || !cost || cost < 1) return;
    onSave({emoji: form.emoji, title: form.title.trim(), cost, oneTime: form.oneTime});
  };

  const stepCost = (delta: number) => {
    const n = parseInt(form.cost, 10) || 0;
    setForm(f => ({...f, cost: String(Math.max(1, n + delta))}));
  };

  const displayEmoji = form.customEmoji || form.emoji;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1, justifyContent: 'flex-end', backgroundColor: c.backdrop}}>
        <View style={{
          backgroundColor: c.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 48,
        }}>
          <View style={{width: 40, height: 4, backgroundColor: c.outlineVariant, borderRadius: 2, alignSelf: 'center', marginTop: 16, marginBottom: 8}} />

          {/* Hero emoji preview */}
          <View style={{alignItems: 'center', paddingTop: 12, paddingBottom: 20}}>
            <View style={{
              width: 88, height: 88, borderRadius: 26,
              backgroundColor: c.primaryContainer,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{fontSize: 50}}>{displayEmoji}</Text>
            </View>
          </View>

          <View style={{height: 1, backgroundColor: c.outlineVariant, marginHorizontal: 0}} />

          <View style={{paddingHorizontal: 24, paddingTop: 20}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, letterSpacing: -0.3}}>{modalTitle}</Text>
              <Button onPress={onClose} mode="text">Close</Button>
            </View>

            {/* Emoji grid */}
            <Text style={{fontSize: 12, fontWeight: '600', color: c.onSurfaceVariant, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5}}>
              Pick an emoji
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
              {EMOJIS.map(e => {
                const selected = form.emoji === e && !form.customEmoji;
                return (
                  <TouchableRipple key={e} onPress={() => setForm(f => ({...f, emoji: e, customEmoji: ''}))} borderless style={{borderRadius: 13}}>
                    <View style={{
                      width: 52, height: 52, borderRadius: 13,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: selected ? c.primaryContainer : c.surfaceVariant,
                      borderWidth: selected ? 2 : 0,
                      borderColor: c.primary,
                    }}>
                      <Text style={{fontSize: 26}}>{e}</Text>
                    </View>
                  </TouchableRipple>
                );
              })}
            </View>

            <TextInput
              mode="outlined"
              label="Or type a custom emoji"
              value={form.customEmoji}
              onChangeText={v => setForm(f => ({...f, customEmoji: v, emoji: v || f.emoji}))}
              placeholder="🏅"
              maxLength={8}
              style={{marginBottom: 20}}
            />

            <View style={{height: 1, backgroundColor: c.outlineVariant, marginBottom: 20}} />

            <TextInput
              mode="outlined"
              label="Reward name"
              value={form.title}
              onChangeText={t => setForm(f => ({...f, title: t}))}
              placeholder="e.g. TV Time, New Shoes…"
              maxLength={40}
              style={{marginBottom: 20}}
            />

            <View style={{height: 1, backgroundColor: c.outlineVariant, marginBottom: 20}} />

            {/* Cost stepper */}
            <Text variant="labelLarge" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
              Push-ups required
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20}}>
              <TouchableRipple onPress={() => stepCost(-5)} borderless style={{borderRadius: 22}}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: c.primaryContainer,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon source="minus" size={20} color={c.onPrimaryContainer} />
                </View>
              </TouchableRipple>

              <TextInput
                mode="flat"
                value={form.cost}
                onChangeText={t => setForm(f => ({...f, cost: t.replace(/[^0-9]/g, '')}))}
                keyboardType="number-pad"
                maxLength={5}
                selectTextOnFocus
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholder="50"
                contentStyle={{fontSize: 48, fontWeight: '300', color: c.primary, textAlign: 'center'}}
                style={{backgroundColor: 'transparent', width: 110}}
              />

              <TouchableRipple onPress={() => stepCost(5)} borderless style={{borderRadius: 22}}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: c.primaryContainer,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon source="plus" size={20} color={c.onPrimaryContainer} />
                </View>
              </TouchableRipple>
            </View>

            <View style={{height: 1, backgroundColor: c.outlineVariant, marginBottom: 20}} />

            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28}}>
              <View style={{flex: 1, marginRight: 12}}>
                <Text style={{fontSize: 15, fontWeight: '600', color: c.onSurface}}>One-time reward</Text>
                <Text style={{fontSize: 12, color: c.onSurfaceVariant, marginTop: 2}}>
                  Removes after redeeming. Off = repeatable.
                </Text>
              </View>
              <Switch value={form.oneTime} onValueChange={v => setForm(f => ({...f, oneTime: v}))} />
            </View>

            {/* Gradient save button */}
            <TouchableOpacity onPress={save} activeOpacity={0.85}>
              <LinearGradient
                {...BRAND_GRADIENT}
                style={{
                  borderRadius: 14, paddingVertical: 16,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#FF4500',
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 6,
                }}>
                <Text style={{color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3}}>
                  Save Reward
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const RewardCard = React.memo(function RewardCard({reward, totalReps, onTryRedeem, onDoubleTap}: {
  reward: Reward;
  totalReps: number;
  onTryRedeem: (r: Reward) => void;
  onDoubleTap: (r: Reward) => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const lastTapRef = useRef<number>(0);
  const canAfford = totalReps >= reward.cost;
  const needed = reward.cost - totalReps;

  // #15 — scale bounce when reward becomes affordable
  const unlockScale = useRef(new Animated.Value(1)).current;
  const wasAffordable = useRef(canAfford);
  useEffect(() => {
    if (!wasAffordable.current && canAfford) {
      Animated.sequence([
        Animated.spring(unlockScale, {toValue: 1.05, useNativeDriver: true, speed: 25, bounciness: 14}),
        Animated.spring(unlockScale, {toValue: 1, useNativeDriver: true, speed: 20}),
      ]).start();
    }
    wasAffordable.current = canAfford;
  }, [canAfford]);

  // #14 — shimmer sweep on unaffordable (locked) cards
  const shimmer = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    if (canAfford) return;
    const anim = Animated.loop(
      Animated.timing(shimmer, {toValue: 1, duration: 2200, useNativeDriver: true}),
    );
    anim.start();
    return () => { anim.stop(); shimmer.setValue(-1); };
  }, [canAfford]);
  const shimmerTranslate = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <Animated.View style={{transform: [{scale: unlockScale}]}}>
    <TouchableRipple onPress={() => {
        const now = Date.now();
        if (now - lastTapRef.current < 400) { onDoubleTap(reward); lastTapRef.current = 0; }
        else { lastTapRef.current = now; }
      }} borderless style={[{
      borderRadius: 20,
      marginBottom: 12,
      backgroundColor: c.surface,
    }, theme.dark ? {} : cardShadow]}>
      <View style={{borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden'}}>
        <View pointerEvents="none" style={{position: 'absolute', top: 8, right: 8}}>
          <Icon source="dots-vertical" size={16} color={c.onSurfaceVariant} />
        </View>
        <View style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: c.surfaceVariant,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{fontSize: 28}}>{reward.emoji}</Text>
        </View>
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
            <Text style={{fontSize: 16, fontWeight: '700', color: c.onSurface}} numberOfLines={1} ellipsizeMode="tail">{reward.title}</Text>
            {reward.oneTime && (
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: c.onSecondaryContainer,
                backgroundColor: c.secondaryContainer,
                paddingHorizontal: 6, paddingVertical: 2,
                borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.4,
              }}>
                one-time
              </Text>
            )}
          </View>
          <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginTop: 4, fontWeight: '500'}}>
            {reward.cost.toLocaleString()} push-ups
          </Text>
        </View>
        <Button
          mode={canAfford ? 'contained' : 'outlined'}
          onPress={() => onTryRedeem(reward)}
          compact
          style={{borderRadius: 24}}>
          {canAfford ? 'Redeem' : `+${needed.toLocaleString()}`}
        </Button>
        {/* #14 — shimmer sweep while locked */}
        {!canAfford && (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            transform: [{translateX: shimmerTranslate}],
          }}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.07)', 'transparent']}
              start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}}
              style={{flex: 1}}
            />
          </Animated.View>
        )}
      </View>
    </TouchableRipple>
    </Animated.View>
  );
});

export default function RewardsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // ponytail: 82 = tab bar bottom offset (12) + bar height (62) + gap (8)
  const fabBottom = Math.max(insets.bottom, 8) + 82;
  const {totalReps, rewards, addReward, editReward, deleteReward, redeemReward, gamblingResult} = useBankStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | undefined>(undefined);
  const [snackbar, setSnackbar] = useState('');
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null);
  const [actionTarget, setActionTarget] = useState<Reward | null>(null);
  const [showSlotWager, setShowSlotWager] = useState(false);
  const [slotWager, setSlotWager] = useState(0);
  const [showSlots, setShowSlots] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  const openAdd = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (r: Reward) => { setEditing(r); setModalOpen(true); };

  const handleSave = (data: Omit<Reward, 'id'>) => {
    if (editing) editReward(editing.id, data);
    else addReward(data);
    setModalOpen(false);
  };

  const handleDoubleTap = useCallback((r: Reward) => setActionTarget(r), []);

  const handleTryRedeem = useCallback((r: Reward) => {
    if (totalReps < r.cost) {
      setSnackbar(`You need ${(r.cost - totalReps).toLocaleString()} more push-ups to unlock this.`);
      return;
    }
    setRedeemTarget(r);
  }, [totalReps]);

  const renderItem = useCallback(({item}: {item: Reward}) => (
    <RewardCard
      reward={item}
      totalReps={totalReps}
      onTryRedeem={handleTryRedeem}
      onDoubleTap={handleDoubleTap}
    />
  ), [totalReps, handleTryRedeem, handleDoubleTap]);

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <Text style={{fontSize: 34, fontWeight: '800', color: c.onBackground, letterSpacing: -0.5}}>
          Rewards
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceVariant,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 100,
            gap: 4,
          }}>
            <Text style={{fontSize: 16}}>💪🏽</Text>
            <Text style={{fontSize: 14, fontWeight: '700', color: c.onBackground}}>
              {totalReps.toLocaleString()}
            </Text>
          </View>
          <IconButton
            icon="cog-outline"
            iconColor={c.onSurfaceVariant}
            size={22}
            onPress={() => navigation.navigate('Settings')}
            style={{margin: 0}}
          />
        </View>
      </View>

      {/* Slots card */}
      <TouchableRipple
        onPress={() => totalReps >= 10 ? setShowSlotWager(true) : undefined}
        borderless
        style={{marginHorizontal: 16, marginBottom: 12, borderRadius: 24, opacity: totalReps >= 10 ? 1 : 0.5}}>
        <View style={[{backgroundColor: c.surface, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14}, theme.dark ? {} : cardShadow]}>
          <Text style={{fontSize: 32}}>🎰</Text>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 16, fontWeight: '800', color: c.onSurface, letterSpacing: -0.3}}>Feeling lucky?</Text>
            <Text style={{fontSize: 12, color: c.onSurfaceVariant, marginTop: 2}}>
              {totalReps >= 10 ? 'Gamble banked reps — win up to 7x or lose it all.' : 'Need 10+ reps to spin'}
            </Text>
          </View>
          <Text style={{fontSize: 18, color: c.onSurfaceVariant, fontWeight: '300'}}>›</Text>
        </View>
      </TouchableRipple>

      <FlatList
        data={rewards}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        contentContainerStyle={[
          {paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120},
          rewards.length === 0 && {flex: 1},
        ]}
        ListEmptyComponent={
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8}}>
            <Text style={{fontSize: 48}}>🏆</Text>
            <Text style={{fontSize: 17, fontWeight: '600', color: c.onSurfaceVariant}}>No rewards yet</Text>
            <Text style={{fontSize: 14, color: c.outline}}>Tap + to create your first one</Text>
            <Text style={{fontSize: 12, color: c.outline, marginTop: 4}}>Double-tap a reward to edit or delete</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Gradient FAB */}
      <Pressable
        onPress={openAdd}
        style={{position: 'absolute', bottom: fabBottom, right: 24}}
        android_ripple={{color: 'rgba(255,255,255,0.25)', borderless: true, radius: 60}}>
        <LinearGradient
          {...BRAND_GRADIENT}
          style={{
            width: 60, height: 60, borderRadius: 18,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#FF4500',
            shadowOffset: {width: 0, height: 6},
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}>
          <Icon source="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000} wrapperStyle={{bottom: Math.max(insets.bottom, 8) + 80}}>
        {snackbar}
      </Snackbar>

      <RewardModal
        visible={modalOpen}
        initial={editing}
        modalTitle={editing ? 'Edit Reward' : 'New Reward'}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      {/* Redeem confirmation dialog */}
      <Portal>
        <Dialog visible={!!redeemTarget} onDismiss={() => setRedeemTarget(null)} style={{borderRadius: 24}}>
          <Dialog.Content style={{paddingTop: 24, alignItems: 'center', gap: 8}}>
            {redeemTarget && (
              <>
                <Text style={{fontSize: 48}}>{redeemTarget.emoji}</Text>
                <Text style={{fontSize: 18, fontWeight: '800', color: c.onSurface, textAlign: 'center', letterSpacing: -0.3}}>
                  Redeem {redeemTarget.title}?
                </Text>
                <Text style={{fontSize: 14, color: c.onSurfaceVariant, textAlign: 'center', marginTop: 4}}>
                  This will use {redeemTarget.cost.toLocaleString()} push-ups from your bank.
                </Text>
                {redeemTarget.oneTime && (
                  <Text style={{fontSize: 13, color: c.error, textAlign: 'center', marginTop: 4}}>
                    This reward will be removed after redemption.
                  </Text>
                )}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRedeemTarget(null)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => {
                redeemReward(redeemTarget!.id);
                setRedeemTarget(null);
                setTimeout(() => confettiRef.current?.start(), 100);
              }}>
              Redeem
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Long-press action dialog */}
        <Dialog visible={!!actionTarget} onDismiss={() => setActionTarget(null)} style={{borderRadius: 24}}>
          <Dialog.Title>{actionTarget?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="labelMedium" style={{color: c.onSurfaceVariant, marginBottom: 4}}>
              {actionTarget?.cost.toLocaleString()} push-ups
            </Text>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant}}>What do you want to do?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={c.error} onPress={() => { deleteReward(actionTarget!.id); setActionTarget(null); }}>Delete</Button>
            <Button onPress={() => { openEdit(actionTarget!); setActionTarget(null); }}>Edit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{x: SCREEN_WIDTH / 2, y: -20}}
        autoStart={false}
        fadeOut
        explosionSpeed={400}
        fallSpeed={2800}
        colors={['#FF5500', '#FF7040', '#FFD700', '#FF2D00', '#FFFFFF', '#FF9A6C']}
      />

      {/* Slot wager picker */}
      <Modal visible={showSlotWager} transparent animationType="fade" onRequestClose={() => setShowSlotWager(false)}>
        <KeyboardAvoidingView behavior="padding" style={{flex: 1, justifyContent: 'flex-end', backgroundColor: c.backdrop}}>
          <View style={{backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48}}>
            <View style={{width: 40, height: 4, backgroundColor: c.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 24}} />
            <Text style={{fontSize: 20, fontWeight: '700', color: c.onSurface, marginBottom: 6, letterSpacing: -0.3}}>How many reps to wager?</Text>
            <Text style={{fontSize: 13, color: c.onSurfaceVariant, marginBottom: 20}}>
              Balance: <Text style={{fontWeight: '800', color: c.primary}}>{totalReps} reps</Text>
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24}}>
              {[10, 25, 50, totalReps].map((amount, i) => {
                const label = i === 3 ? 'ALL IN' : String(amount);
                const disabled = totalReps < amount;
                return (
                  <TouchableOpacity
                    key={label}
                    disabled={disabled}
                    onPress={() => {
                      setSlotWager(amount);
                      setShowSlotWager(false);
                      setTimeout(() => setShowSlots(true), 200);
                    }}
                    style={{
                      flex: 1, minWidth: '40%',
                      backgroundColor: i === 3 ? c.errorContainer : c.surfaceVariant,
                      borderRadius: 14, padding: 16, alignItems: 'center',
                      opacity: disabled ? 0.35 : 1,
                    }}>
                    <Text style={{fontSize: 18, fontWeight: '900', color: i === 3 ? c.error : c.onSurface}}>{label}</Text>
                    {i !== 3 && <Text style={{fontSize: 11, color: c.onSurfaceVariant, marginTop: 2}}>reps</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button mode="text" onPress={() => setShowSlotWager(false)}>Cancel</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <RepSlotsModal
        visible={showSlots}
        wager={slotWager}
        onResult={payout => gamblingResult(slotWager, payout)}
        onClose={() => setShowSlots(false)}
      />
    </View>
  );
}
