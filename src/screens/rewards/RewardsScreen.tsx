import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useBankStore, Reward} from '../../store/bankStore';

const EMOJIS = [
  '🏆','🎁','🎉','⭐','💫',
  '📺','🎮','🎬','🎵','🎧',
  '🍕','🍔','🍰','🍩','☕',
  '👕','👟','🎒','💵','💳',
  '💪','🔥','😴','🛋️','🏖️',
];
const DEFAULT_EMOJI = '🏆';

interface FormState {
  emoji: string;
  title: string;
  cost: string;
}

function RewardModal({
  visible,
  initial,
  modalTitle,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial?: Reward;
  modalTitle: string;
  onSave: (data: Omit<Reward, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    emoji: DEFAULT_EMOJI,
    title: '',
    cost: '',
  });

  useEffect(() => {
    if (visible) {
      setForm({
        emoji: initial?.emoji ?? DEFAULT_EMOJI,
        title: initial?.title ?? '',
        cost: initial?.cost?.toString() ?? '',
      });
    }
  }, [visible, initial]);

  const save = () => {
    const cost = parseInt(form.cost, 10);
    if (!form.title.trim()) {Alert.alert('Name your reward'); return;}
    if (!cost || cost < 1) {Alert.alert('Set a push-up cost'); return;}
    onSave({emoji: form.emoji, title: form.title.trim(), cost});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Emoji</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, form.emoji === e && styles.emojiBtnActive]}
                onPress={() => setForm(f => ({...f, emoji: e}))}>
                <Text style={styles.emojiTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Reward name</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={t => setForm(f => ({...f, title: t}))}
            placeholder="e.g. TV Time, New Shoes…"
            placeholderTextColor="#333"
            maxLength={40}
          />

          <Text style={styles.fieldLabel}>Push-ups required</Text>
          <TextInput
            style={[styles.input, styles.inputNarrow]}
            value={form.cost}
            onChangeText={t => setForm(f => ({...f, cost: t.replace(/[^0-9]/g, '')}))}
            placeholder="50"
            placeholderTextColor="#333"
            keyboardType="number-pad"
            maxLength={5}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
            <Text style={styles.saveBtnTxt}>Save Reward</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RewardCard({
  reward,
  totalReps,
  onRedeem,
  onLongPress,
}: {
  reward: Reward;
  totalReps: number;
  onRedeem: () => void;
  onLongPress: () => void;
}) {
  const canAfford = totalReps >= reward.cost;
  const needed = reward.cost - totalReps;

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={onLongPress}
      activeOpacity={0.9}
      delayLongPress={400}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>{reward.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{reward.title}</Text>
          <Text style={styles.cardCost}>{reward.cost.toLocaleString()} push-ups</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.redeemBtn, !canAfford && styles.redeemBtnLocked]}
        onPress={canAfford ? onRedeem : undefined}
        activeOpacity={canAfford ? 0.75 : 1}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={[styles.redeemTxt, !canAfford && styles.redeemTxtLocked]}>
          {canAfford ? 'Redeem' : `+${needed.toLocaleString()}`}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function RewardsScreen() {
  const {totalReps, rewards, addReward, editReward, deleteReward, redeemReward} = useBankStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | undefined>(undefined);

  const openAdd = () => {setEditing(undefined); setModalOpen(true);};
  const openEdit = (r: Reward) => {setEditing(r); setModalOpen(true);};

  const handleSave = (data: Omit<Reward, 'id'>) => {
    if (editing) {
      editReward(editing.id, data);
    } else {
      addReward(data);
    }
    setModalOpen(false);
  };

  const handleLongPress = (r: Reward) => {
    Alert.alert(r.title, 'What do you want to do?', [
      {text: 'Edit', onPress: () => openEdit(r)},
      {text: 'Delete', style: 'destructive', onPress: () => deleteReward(r.id)},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const handleRedeem = (r: Reward) => {
    Alert.alert(
      `Redeem ${r.emoji} ${r.title}?`,
      `This will use ${r.cost.toLocaleString()} push-ups from your bank.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Redeem', onPress: () => redeemReward(r.id)},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Rewards</Text>

      <View style={styles.bankBar}>
        <Text style={styles.bankNum}>{totalReps.toLocaleString()}</Text>
        <Text style={styles.bankLabel}> push-ups banked</Text>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={r => r.id}
        renderItem={({item}) => (
          <RewardCard
            reward={item}
            totalReps={totalReps}
            onRedeem={() => handleRedeem(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={[styles.list, rewards.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No rewards yet.</Text>
            <Text style={styles.emptySub}>Tap + to create your first one.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      <RewardModal
        visible={modalOpen}
        initial={editing}
        modalTitle={editing ? 'Edit Reward' : 'New Reward'}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a'},
  header: {fontSize: 32, fontWeight: '700', color: '#fff', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4},

  bankBar: {flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 20, paddingBottom: 20},
  bankNum: {fontSize: 28, fontWeight: '700', color: '#FF6B00'},
  bankLabel: {fontSize: 15, color: '#555'},

  list: {paddingHorizontal: 16, paddingBottom: 100},
  listEmpty: {flex: 1},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyTxt: {fontSize: 18, color: '#333', fontWeight: '600'},
  emptySub: {fontSize: 14, color: '#2a2a2a', marginTop: 8},

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 18,
    marginBottom: 10,
  },
  cardLeft: {flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14},
  cardEmoji: {fontSize: 34},
  cardInfo: {flex: 1},
  cardTitle: {fontSize: 17, fontWeight: '600', color: '#fff'},
  cardCost: {fontSize: 13, color: '#555', marginTop: 3},

  redeemBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
  },
  redeemBtnLocked: {backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a'},
  redeemTxt: {fontSize: 14, fontWeight: '700', color: '#fff'},
  redeemTxtLocked: {color: '#444'},

  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabTxt: {fontSize: 32, color: '#fff', lineHeight: 36},

  // Modal
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)'},
  modalSheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24},
  modalTitle: {fontSize: 20, fontWeight: '700', color: '#fff'},
  modalClose: {fontSize: 18, color: '#555'},

  fieldLabel: {fontSize: 12, fontWeight: '600', color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10},

  emojiGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24},
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBtnActive: {backgroundColor: '#2a1a00', borderWidth: 2, borderColor: '#FF6B00'},
  emojiTxt: {fontSize: 24},

  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  inputNarrow: {width: 120},

  saveBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnTxt: {fontSize: 17, fontWeight: '700', color: '#fff'},
});
