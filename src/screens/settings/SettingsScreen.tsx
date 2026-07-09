import React, {useState} from 'react';
import {View, ScrollView, Linking, Alert} from 'react-native';
import {
  Appbar, Text, List, Switch, Divider, Portal, Dialog, Button,
  RadioButton, TextInput, useTheme, Icon,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useThemeStore, ThemeMode} from '../../store/themeStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useBankStore} from '../../store/bankStore';
import {useAlarmStore} from '../../store/alarmStore';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;
type DialogKey = 'theme' | 'defaultReps' | 'dailyGoal' | 'about' | 'resetSettings' | 'resetAll' | null;

const THEME_OPTIONS: {label: string; value: ThemeMode; icon: string}[] = [
  {label: 'Follow System', value: 'system', icon: 'theme-light-dark'},
  {label: 'Light', value: 'light', icon: 'white-balance-sunny'},
  {label: 'Dark', value: 'dark', icon: 'moon-waning-crescent'},
];

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();

  const {mode, setMode} = useThemeStore();
  const settings = useSettingsStore();
  const {reset: resetBank} = useBankStore();
  const {reset: resetAlarms} = useAlarmStore();

  const [dialog, setDialog] = useState<DialogKey>(null);
  const [tempReps, setTempReps] = useState('');
  const [tempGoal, setTempGoal] = useState('');
  const [tempTheme, setTempTheme] = useState<ThemeMode>('system');

  const open = (key: DialogKey) => {
    if (key === 'defaultReps') setTempReps(String(settings.defaultReps));
    if (key === 'dailyGoal') setTempGoal(settings.dailyGoal > 0 ? String(settings.dailyGoal) : '');
    if (key === 'theme') setTempTheme(mode);
    setDialog(key);
  };
  const close = () => setDialog(null);

  const saveReps = () => {
    const n = parseInt(tempReps, 10);
    if (n >= 1) settings.update({defaultReps: n});
    close();
  };

  const saveGoal = () => {
    const n = parseInt(tempGoal, 10);
    settings.update({dailyGoal: n > 0 ? n : 0});
    close();
  };

  const saveTheme = () => { setMode(tempTheme); close(); };

  const handleResetSettings = () => { settings.reset(); close(); };

  const handleResetAll = async () => {
    settings.reset();
    resetBank();
    await resetAlarms();
    close();
  };

  const themeLabel = THEME_OPTIONS.find(o => o.value === mode)?.label ?? 'System';

  const sectionHeader = (label: string, color?: string) => (
    <List.Subheader style={{
      color: color ?? c.primary,
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.8,
      paddingTop: 24,
      paddingBottom: 4,
    }}>
      {label.toUpperCase()}
    </List.Subheader>
  );

  const SettingIcon = ({icon, bg, fg}: {icon: string; bg?: string; fg?: string}) => (
    <View style={{
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: bg ?? c.secondaryContainer,
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 4,
    }}>
      <Icon source={icon} size={22} color={fg ?? c.onSecondaryContainer} />
    </View>
  );

  const SwitchRow = ({
    icon, iconBg, iconFg, title, description, value, onChange,
  }: {
    icon: string; iconBg?: string; iconFg?: string;
    title: string; description?: string;
    value: boolean; onChange: (v: boolean) => void;
  }) => (
    <List.Item
      title={title}
      description={description}
      titleStyle={{fontSize: 15}}
      descriptionStyle={{fontSize: 12, marginTop: 1}}
      descriptionNumberOfLines={2}
      left={() => (
        <View style={{justifyContent: 'center', paddingLeft: 16}}>
          <SettingIcon icon={icon} bg={iconBg} fg={iconFg} />
        </View>
      )}
      right={() => (
        <View style={{justifyContent: 'center', paddingRight: 8}}>
          <Switch value={value} onValueChange={onChange} />
        </View>
      )}
      onPress={() => onChange(!value)}
      style={{paddingVertical: 4}}
    />
  );

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>

        {/* ── APPEARANCE ── */}
        {sectionHeader('Appearance')}
        <List.Item
          title="Theme"
          description={themeLabel}
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="palette-outline" /></View>}
          right={p => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => open('theme')}
          style={{paddingVertical: 4}}
        />

        <Divider style={{marginTop: 8}} />

        {/* ── ALARM DEFAULTS ── */}
        {sectionHeader('Alarm Defaults')}
        <List.Item
          title="Default push-ups"
          description={`${settings.defaultReps} reps per new alarm`}
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="counter" /></View>}
          right={p => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => open('defaultReps')}
          style={{paddingVertical: 4}}
        />

        <Divider style={{marginTop: 8}} />

        {/* ── ALARM BEHAVIOR ── */}
        {sectionHeader('Alarm Behavior')}
        <SwitchRow
          icon="check-circle-outline"
          title="Auto-dismiss when done"
          description="Alarm closes the moment you finish your reps"
          value={settings.autoCompleteAlarm}
          onChange={v => settings.update({autoCompleteAlarm: v})}
        />
        <Divider leftInset />
        <SwitchRow
          icon="volume-mute"
          title="Mute alarm during push-ups"
          description="Silences alarm sound once camera counting starts"
          value={settings.muteAudioDuringPushups}
          onChange={v => settings.update({muteAudioDuringPushups: v})}
        />
        <Divider leftInset />
        <SwitchRow
          icon="vibrate"
          title="Vibrate on alarm"
          description="Phone vibrates when alarm fires"
          value={settings.vibrateOnAlarm}
          onChange={v => settings.update({vibrateOnAlarm: v})}
        />

        <Divider style={{marginTop: 8}} />

        {/* ── PUSH-UP SESSION ── */}
        {sectionHeader('Push-up Session')}
        <SwitchRow
          icon="hand-wave-outline"
          title="Haptic feedback per rep"
          description="Phone buzzes briefly each time a rep is counted"
          value={settings.hapticOnRep}
          onChange={v => settings.update({hapticOnRep: v})}
        />
        <Divider leftInset />
        <SwitchRow
          icon="music-note"
          title="Audio cue per rep"
          description="Plays a short sound when each rep is counted"
          value={settings.audioCueOnRep}
          onChange={v => settings.update({audioCueOnRep: v})}
        />
        <Divider leftInset />
        <SwitchRow
          icon="monitor-shimmer"
          title="Keep screen on"
          description="Prevents screen from sleeping during a push-up session"
          value={settings.keepScreenOn}
          onChange={v => settings.update({keepScreenOn: v})}
        />
        <Divider leftInset />
        <SwitchRow
          icon="camera-flip-outline"
          title="Use front camera"
          description="Off = use rear camera instead"
          value={settings.preferFrontCamera}
          onChange={v => settings.update({preferFrontCamera: v})}
        />

        <Divider style={{marginTop: 8}} />

        {/* ── GOALS ── */}
        {sectionHeader('Goals')}
        <List.Item
          title="Daily push-up goal"
          description={settings.dailyGoal > 0 ? `${settings.dailyGoal} push-ups per day` : 'Off'}
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="flag-outline" /></View>}
          right={p => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => open('dailyGoal')}
          style={{paddingVertical: 4}}
        />

        <Divider style={{marginTop: 8}} />

        {/* ── APP ── */}
        {sectionHeader('App')}
        <List.Item
          title="Permissions"
          description="Camera, notifications, battery & more"
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="shield-check-outline" /></View>}
          right={p => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('Permissions')}
          style={{paddingVertical: 4}}
        />
        <Divider leftInset />
        <List.Item
          title="Rate PushRise"
          description="Enjoying it? Leave a review"
          left={() => (
            <View style={{justifyContent: 'center', paddingLeft: 16}}>
              <SettingIcon icon="star-outline" bg={c.tertiaryContainer} fg={c.onTertiaryContainer} />
            </View>
          )}
          right={p => <List.Icon {...p} icon="open-in-new" />}
          onPress={() =>
            Linking.openURL('https://play.google.com/store/apps/details?id=com.pushrise').catch(() =>
              Alert.alert('Not yet', 'The app is not on the Play Store yet.'),
            )
          }
          style={{paddingVertical: 4}}
        />
        <Divider leftInset />
        <List.Item
          title="Privacy Policy"
          description="How we handle your data"
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="file-document-outline" /></View>}
          right={p => <List.Icon {...p} icon="open-in-new" />}
          onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available before launch.')}
          style={{paddingVertical: 4}}
        />
        <Divider leftInset />
        <List.Item
          title="Contact Support"
          description="syreeseofficial@gmail.com"
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="email-outline" /></View>}
          right={p => <List.Icon {...p} icon="open-in-new" />}
          onPress={() =>
            Linking.openURL('mailto:syreeseofficial@gmail.com?subject=PushRise%20Support').catch(() => {})
          }
          style={{paddingVertical: 4}}
        />
        <Divider leftInset />
        <List.Item
          title="About"
          description={`PushRise v${APP_VERSION}`}
          left={() => <View style={{justifyContent: 'center', paddingLeft: 16}}><SettingIcon icon="information-outline" /></View>}
          right={p => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => open('about')}
          style={{paddingVertical: 4}}
        />

        <Divider style={{marginTop: 8}} />

        {/* ── RESET ── */}
        {sectionHeader('Reset', c.error)}
        <List.Item
          title="Reset Settings"
          description="Restore all settings to defaults"
          titleStyle={{color: c.error}}
          left={() => (
            <View style={{justifyContent: 'center', paddingLeft: 16}}>
              <SettingIcon icon="restore" bg={c.errorContainer} fg={c.onErrorContainer} />
            </View>
          )}
          onPress={() => open('resetSettings')}
          style={{paddingVertical: 4}}
        />
        <Divider leftInset />
        <List.Item
          title="Reset All Data"
          description="Delete all alarms, rewards, progress, and settings"
          titleStyle={{color: c.error, fontWeight: '700'}}
          left={() => (
            <View style={{justifyContent: 'center', paddingLeft: 16}}>
              <SettingIcon icon="delete-forever-outline" bg={c.errorContainer} fg={c.onErrorContainer} />
            </View>
          )}
          onPress={() => open('resetAll')}
          style={{paddingVertical: 4}}
        />

        <View style={{height: 16}} />
      </ScrollView>

      {/* ── DIALOGS ── */}
      <Portal>

        {/* Theme picker */}
        <Dialog visible={dialog === 'theme'} onDismiss={close}>
          <Dialog.Title>Theme</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group value={tempTheme} onValueChange={v => setTempTheme(v as ThemeMode)}>
              {THEME_OPTIONS.map(o => (
                <RadioButton.Item key={o.value} label={o.label} value={o.value} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button onPress={saveTheme}>Apply</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Default reps */}
        <Dialog visible={dialog === 'defaultReps'} onDismiss={close}>
          <Dialog.Title>Default Push-ups</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
              New alarms will start with this many reps.
            </Text>
            <TextInput
              mode="outlined"
              label="Push-ups"
              value={tempReps}
              onChangeText={setTempReps}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
              autoFocus
              contentStyle={{fontSize: 32, fontWeight: '300', color: c.primary}}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button onPress={saveReps}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Daily goal */}
        <Dialog visible={dialog === 'dailyGoal'} onDismiss={close}>
          <Dialog.Title>Daily Push-up Goal</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
              Track your daily progress on the Progress tab. Leave blank to turn off.
            </Text>
            <TextInput
              mode="outlined"
              label="Goal (push-ups)"
              value={tempGoal}
              onChangeText={setTempGoal}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
              autoFocus
              placeholder="e.g. 100"
              contentStyle={{fontSize: 32, fontWeight: '300', color: c.primary}}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button onPress={saveGoal}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* About */}
        <Dialog visible={dialog === 'about'} onDismiss={close} style={{borderRadius: 28}}>
          <Dialog.Content style={{paddingTop: 28, alignItems: 'center'}}>
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: c.primaryContainer,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Icon source="alarm" size={40} color={c.onPrimaryContainer} />
            </View>
            <Text variant="headlineSmall" style={{fontWeight: '800', marginBottom: 4}}>PushRise</Text>
            <Text variant="labelMedium" style={{color: c.onSurfaceVariant, marginBottom: 20}}>
              Version {APP_VERSION}
            </Text>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 20}}>
              Stop snoozing. Start grinding.{'\n\n'}
              Every alarm requires push-ups before it silences. Bank your reps and redeem them for rewards you actually want.
            </Text>
            <View style={{alignSelf: 'flex-start', gap: 8}}>
              {[
                '📷  Camera push-up detection',
                '🏦  Reward banking system',
                '🔥  Daily streak tracking',
                '⏰  Customizable alarms & sounds',
              ].map(f => (
                <Text key={f} variant="bodySmall" style={{color: c.onSurfaceVariant}}>{f}</Text>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Reset Settings confirmation */}
        <Dialog visible={dialog === 'resetSettings'} onDismiss={close}>
          <Dialog.Title>Reset Settings?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant}}>
              All settings will go back to their defaults. Your alarms, rewards, and progress are not affected.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button textColor={c.error} onPress={handleResetSettings}>Reset</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Reset All confirmation */}
        <Dialog visible={dialog === 'resetAll'} onDismiss={close}>
          <Dialog.Icon icon="alert-circle-outline" color={c.error} />
          <Dialog.Title style={{textAlign: 'center'}}>Reset Everything?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant}}>
              This permanently deletes all your alarms, rewards, push-up progress, streak data, and settings.{'\n\n'}
              This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button textColor={c.error} onPress={handleResetAll}>Delete Everything</Button>
          </Dialog.Actions>
        </Dialog>

      </Portal>
    </View>
  );
}
