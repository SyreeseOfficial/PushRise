import React, {useState, useEffect} from 'react';
import {FlatList, View, Modal, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import {
  Appbar, FAB, Text, Button, Surface, TextInput,
  TouchableRipple, useTheme, Divider, Switch, Snackbar,
} from 'react-native-paper';
import {useBankStore, Reward} from '../../store/bankStore';

// 4 rows × 5 columns = 20 default emojis
const EMOJIS = [
  '🏆','🎁','🎉','⭐','💫',
  '📺','🎮','🎬','🎵','🎧',
  '🍕','🍔','🍰','🍩','☕',
  '👕','👟','🎒','💵','💪',
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
    if (!form.title.trim()) return;
    if (!cost || cost < 1) return;
    onSave({emoji: form.emoji, title: form.title.trim(), cost, oneTime: form.oneTime});
  };

  const selectGridEmoji = (e: string) => setForm(f => ({...f, emoji: e, customEmoji: ''}));

  const sheetBg = {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.backdrop}}>
        <View style={sheetBg}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
            <Text variant="titleLarge">{modalTitle}</Text>
            <Button onPress={onClose} mode="text">Close</Button>
          </View>

          {/* Emoji grid — 4 rows */}
          <Text variant="labelLarge" style={{color: theme.colors.onSurfaceVariant, marginBottom: 10}}>
            Emoji
          </Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
            {EMOJIS.map(e => (
              <TouchableRipple
                key={e}
                onPress={() => selectGridEmoji(e)}
                borderless
                style={{borderRadius: 12}}>
                <Surface
                  elevation={0}
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: form.emoji === e && !form.customEmoji
                      ? theme.colors.secondaryContainer
                      : theme.colors.surfaceVariant,
                  }}>
                  <Text style={{fontSize: 24}}>{e}</Text>
                </Surface>
              </TouchableRipple>
            ))}
          </View>

          {/* Custom emoji input */}
          <TextInput
            mode="outlined"
            label="Or type a custom emoji"
            value={form.customEmoji}
            onChangeText={v => {
              setForm(f => ({...f, customEmoji: v, emoji: v || f.emoji}));
            }}
            placeholder="🏅"
            maxLength={8}
            style={{marginBottom: 16}}
          />

          {/* Reward name */}
          <TextInput
            mode="outlined"
            label="Reward name"
            value={form.title}
            onChangeText={t => setForm(f => ({...f, title: t}))}
            placeholder="e.g. TV Time, New Shoes…"
            maxLength={40}
            style={{marginBottom: 16}}
          />

          {/* Cost */}
          <TextInput
            mode="outlined"
            label="Push-ups required"
            value={form.cost}
            onChangeText={t => setForm(f => ({...f, cost: t.replace(/[^0-9]/g, '')}))}
            placeholder="50"
            keyboardType="number-pad"
            maxLength={5}
            style={{width: 160, marginBottom: 16}}
          />

          {/* One-time toggle */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24}}>
            <View style={{flex: 1, marginRight: 12}}>
              <Text variant="labelLarge">One-time reward</Text>
              <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 2}}>
                Removes from list after you redeem it. Off = repeatable.
              </Text>
            </View>
            <Switch value={form.oneTime} onValueChange={v => setForm(f => ({...f, oneTime: v}))} />
          </View>

          <Button mode="contained" onPress={save} contentStyle={{paddingVertical: 8}}>
            Save Reward
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RewardCard({reward, totalReps, onTryRedeem, onLongPress}: {
  reward: Reward;
  totalReps: number;
  onTryRedeem: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const canAfford = totalReps >= reward.cost;
  const needed = reward.cost - totalReps;

  return (
    <TouchableRipple onLongPress={onLongPress} borderless style={{borderRadius: 16, marginBottom: 10}}>
      <Surface elevation={1} style={{borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center'}}>
        <View style={{marginRight: 14}}>
          <Text style={{fontSize: 34}}>{reward.emoji}</Text>
        </View>
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text variant="titleMedium">{reward.title}</Text>
            {reward.oneTime && (
              <Text variant="labelSmall" style={{
                color: theme.colors.onSecondaryContainer,
                backgroundColor: theme.colors.secondaryContainer,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                one-time
              </Text>
            )}
          </View>
          <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 3}}>
            {reward.cost.toLocaleString()} push-ups
          </Text>
        </View>
        <Button
          mode={canAfford ? 'contained' : 'outlined'}
          onPress={onTryRedeem}
          compact
          style={{borderRadius: 24}}>
          {canAfford ? 'Redeem' : `+${needed.toLocaleString()}`}
        </Button>
      </Surface>
    </TouchableRipple>
  );
}

export default function RewardsScreen() {
  const theme = useTheme();
  const {totalReps, rewards, addReward, editReward, deleteReward, redeemReward} = useBankStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | undefined>(undefined);
  const [snackbar, setSnackbar] = useState('');

  const openAdd = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (r: Reward) => { setEditing(r); setModalOpen(true); };

  const handleSave = (data: Omit<Reward, 'id'>) => {
    if (editing) editReward(editing.id, data);
    else addReward(data);
    setModalOpen(false);
  };

  const handleLongPress = (r: Reward) => {
    Alert.alert(r.title, 'What do you want to do?', [
      {text: 'Edit', onPress: () => openEdit(r)},
      {text: 'Delete', style: 'destructive', onPress: () => deleteReward(r.id)},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const handleTryRedeem = (r: Reward) => {
    if (totalReps < r.cost) {
      const needed = r.cost - totalReps;
      setSnackbar(`You need ${needed.toLocaleString()} more push-ups to unlock this.`);
      return;
    }
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
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Appbar.Header>
        <Appbar.Content title="Rewards" />
      </Appbar.Header>

      <View style={{flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 20, paddingBottom: 16}}>
        <Text style={{fontSize: 28, fontWeight: '700', color: theme.colors.primary}}>
          {totalReps.toLocaleString()}
        </Text>
        <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant}}> push-ups banked</Text>
      </View>

      <Divider />

      <FlatList
        data={rewards}
        keyExtractor={r => r.id}
        renderItem={({item}) => (
          <RewardCard
            reward={item}
            totalReps={totalReps}
            onTryRedeem={() => handleTryRedeem(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={[
          {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100},
          rewards.length === 0 && {flex: 1},
        ]}
        ListEmptyComponent={
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80}}>
            <Text variant="titleMedium" style={{color: theme.colors.onSurfaceVariant}}>No rewards yet</Text>
            <Text variant="bodyMedium" style={{color: theme.colors.outline, marginTop: 8}}>
              Tap + to create your first one
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        variant="primary"
        style={{position: 'absolute', bottom: 88, right: 24}}
        onPress={openAdd}
      />

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={3000}>
        {snackbar}
      </Snackbar>

      <RewardModal
        visible={modalOpen}
        initial={editing}
        modalTitle={editing ? 'Edit Reward' : 'New Reward'}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </View>
  );
}
