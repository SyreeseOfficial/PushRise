import React, {useState} from 'react';
import {View, ScrollView, Linking, Alert, TouchableOpacity} from 'react-native';
import {
  Text, Switch, Portal, Dialog, Button,
  RadioButton, TextInput, useTheme, Icon, Divider,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useThemeStore, ThemeMode} from '../../store/themeStore';
import {useSettingsStore} from '../../store/settingsStore';
import {useBankStore} from '../../store/bankStore';
import {useAlarmStore} from '../../store/alarmStore';
import {cardShadow} from '../../theme';
import type {RootStackParamList} from '../../navigation/navigationRef';

type Nav = StackNavigationProp<RootStackParamList>;
type DialogKey = 'theme' | 'defaultReps' | 'dailyGoal' | 'grindingFor' | 'about' | 'resetSettings' | 'resetAll' | null;

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
  const [tempGrinding, setTempGrinding] = useState('');
  const [tempTheme, setTempTheme] = useState<ThemeMode>('system');

  const open = (key: DialogKey) => {
    if (key === 'defaultReps') setTempReps(String(settings.defaultReps));
    if (key === 'dailyGoal') setTempGoal(settings.dailyGoal > 0 ? String(settings.dailyGoal) : '');
    if (key === 'grindingFor') setTempGrinding(settings.grindingFor);
    if (key === 'theme') setTempTheme(mode);
    setDialog(key);
  };
  const close = () => setDialog(null);

  const saveReps = () => { const n = parseInt(tempReps, 10); if (n >= 1) settings.update({defaultReps: n}); close(); };
  const saveGoal = () => { const n = parseInt(tempGoal, 10); settings.update({dailyGoal: n > 0 ? n : 0}); close(); };
  const saveGrinding = () => { settings.update({grindingFor: tempGrinding.trim()}); close(); };
  const saveTheme = () => { setMode(tempTheme); close(); };
  const handleResetSettings = () => { settings.reset(); close(); };
  const handleResetAll = async () => { settings.reset(); resetBank(); await resetAlarms(); close(); };

  const themeLabel = THEME_OPTIONS.find(o => o.value === mode)?.label ?? 'System';

  // iOS-grouped card container
  const Card = ({children}: {children: React.ReactNode}) => (
    <View style={[{
      backgroundColor: c.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      overflow: 'hidden',
    }, theme.dark ? {} : cardShadow]}>
      {children}
    </View>
  );

  const SectionLabel = ({label, color}: {label: string; color?: string}) => (
    <Text style={{
      fontSize: 12, fontWeight: '600', letterSpacing: 0.5,
      color: color ?? c.onSurfaceVariant,
      paddingHorizontal: 28, paddingTop: 28, paddingBottom: 8,
      textTransform: 'uppercase',
    }}>
      {label}
    </Text>
  );

  const SettingIcon = ({icon, bg, fg}: {icon: string; bg?: string; fg?: string}) => (
    <View style={{
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: bg ?? c.surfaceVariant,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon source={icon} size={20} color={fg ?? c.onSurfaceVariant} />
    </View>
  );

  // Row with trailing chevron / value
  const TapRow = ({
    icon, iconBg, iconFg, title, value, onPress, last = false,
  }: {
    icon: string; iconBg?: string; iconFg?: string;
    title: string; value?: string;
    onPress: () => void; last?: boolean;
  }) => (
    <>
      <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 12,
      }}>
        <SettingIcon icon={icon} bg={iconBg} fg={iconFg} />
        <Text style={{flex: 1, fontSize: 15, color: c.onSurface}}>{title}</Text>
        {value && <Text style={{fontSize: 14, color: c.onSurfaceVariant}}>{value}</Text>}
        <Icon source="chevron-right" size={18} color={c.onSurfaceVariant} />
      </TouchableOpacity>
      {!last && <Divider style={{marginLeft: 64}} />}
    </>
  );

  // Row with trailing switch
  const SwitchRow = ({
    icon, iconBg, iconFg, title, description, value, onChange, last = false,
  }: {
    icon: string; iconBg?: string; iconFg?: string;
    title: string; description?: string;
    value: boolean; onChange: (v: boolean) => void; last?: boolean;
  }) => (
    <>
      <TouchableOpacity onPress={() => onChange(!value)} activeOpacity={0.6} style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, gap: 12,
      }}>
        <SettingIcon icon={icon} bg={iconBg} fg={iconFg} />
        <View style={{flex: 1}}>
          <Text style={{fontSize: 15, color: c.onSurface}}>{title}</Text>
          {description && (
            <Text style={{fontSize: 12, color: c.onSurfaceVariant, marginTop: 2}}>{description}</Text>
          )}
        </View>
        <Switch value={value} onValueChange={onChange} />
      </TouchableOpacity>
      {!last && <Divider style={{marginLeft: 64}} />}
    </>
  );

  // Danger tap row (no icon box, red text)
  const DangerRow = ({title, description, onPress, last = false}: {
    title: string; description?: string; onPress: () => void; last?: boolean;
  }) => (
    <>
      <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={{
        paddingHorizontal: 16, paddingVertical: 14,
      }}>
        <Text style={{fontSize: 15, color: c.error, fontWeight: '600'}}>{title}</Text>
        {description && (
          <Text style={{fontSize: 12, color: c.onSurfaceVariant, marginTop: 2}}>{description}</Text>
        )}
      </TouchableOpacity>
      {!last && <Divider />}
    </>
  );

  return (
    <View style={{flex: 1, backgroundColor: theme.dark ? c.background : c.surfaceVariant}}>
      {/* Large title */}
      <View style={{paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8}}>
        <Text style={{fontSize: 34, fontWeight: '800', color: c.onBackground, letterSpacing: -0.5}}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 48}} showsVerticalScrollIndicator={false}>

        <SectionLabel label="Appearance" />
        <Card>
          <TapRow
            icon="palette-outline"
            title="Theme"
            value={themeLabel}
            onPress={() => open('theme')}
            last
          />
        </Card>

        <SectionLabel label="Alarm Defaults" />
        <Card>
          <TapRow
            icon="counter"
            title="Default push-ups"
            value={`${settings.defaultReps} reps`}
            onPress={() => open('defaultReps')}
            last
          />
        </Card>

        <SectionLabel label="Alarm Behavior" />
        <Card>
          <SwitchRow
            icon="check-circle-outline"
            title="Auto-dismiss when done"
            description="Alarm closes the moment you finish your reps"
            value={settings.autoCompleteAlarm}
            onChange={v => settings.update({autoCompleteAlarm: v})}
          />
          <SwitchRow
            icon="volume-mute"
            title="Mute alarm during push-ups"
            description="Silences alarm sound once camera counting starts"
            value={settings.muteAudioDuringPushups}
            onChange={v => settings.update({muteAudioDuringPushups: v})}
          />
          <SwitchRow
            icon="vibrate"
            title="Vibrate on alarm"
            description="Phone vibrates when alarm fires"
            value={settings.vibrateOnAlarm}
            onChange={v => settings.update({vibrateOnAlarm: v})}
            last
          />
        </Card>

        <SectionLabel label="Push-up Session" />
        <Card>
          <SwitchRow
            icon="hand-wave-outline"
            title="Haptic feedback per rep"
            description="Phone buzzes briefly each time a rep is counted"
            value={settings.hapticOnRep}
            onChange={v => settings.update({hapticOnRep: v})}
          />
          <SwitchRow
            icon="music-note"
            title="Audio cue per rep"
            description="Plays a short sound when each rep is counted"
            value={settings.audioCueOnRep}
            onChange={v => settings.update({audioCueOnRep: v})}
          />
          <SwitchRow
            icon="monitor-shimmer"
            title="Keep screen on"
            description="Prevents screen from sleeping during a push-up session"
            value={settings.keepScreenOn}
            onChange={v => settings.update({keepScreenOn: v})}
          />
          <SwitchRow
            icon="camera-flip-outline"
            title="Use front camera"
            description="Off = use rear camera instead"
            value={settings.preferFrontCamera}
            onChange={v => settings.update({preferFrontCamera: v})}
            last
          />
        </Card>

        <SectionLabel label="Goals" />
        <Card>
          <TapRow
            icon="flag-outline"
            title="Daily push-up goal"
            value={settings.dailyGoal > 0 ? `${settings.dailyGoal} reps` : 'Off'}
            onPress={() => open('dailyGoal')}
          />
          <TapRow
            icon="target"
            title="What are you grinding for?"
            value={settings.grindingFor ? '✓' : 'Not set'}
            onPress={() => open('grindingFor')}
            last
          />
        </Card>

        <SectionLabel label="App" />
        <Card>
          <TapRow
            icon="shield-check-outline"
            title="Permissions"
            onPress={() => navigation.navigate('Permissions')}
          />
          <TapRow
            icon="star-outline"
            iconBg={c.primary}
            iconFg="#FFFFFF"
            title="Rate PushRise"
            onPress={() =>
              Linking.openURL('https://play.google.com/store/apps/details?id=com.pushrise').catch(() =>
                Alert.alert('Not yet', 'The app is not on the Play Store yet.'),
              )
            }
          />
          <TapRow
            icon="file-document-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available before launch.')}
          />
          <TapRow
            icon="email-outline"
            title="Contact Support"
            onPress={() =>
              Linking.openURL('mailto:syreeseofficial@gmail.com?subject=PushRise%20Support').catch(() => {})
            }
          />
          <TapRow
            icon="information-outline"
            title="About"
            value={`v${APP_VERSION}`}
            onPress={() => open('about')}
            last
          />
        </Card>

        <SectionLabel label="Danger Zone" color={c.error} />
        <Card>
          <DangerRow
            title="Reset Settings"
            description="Restore all settings to defaults"
            onPress={() => open('resetSettings')}
          />
          <DangerRow
            title="Reset All Data"
            description="Delete all alarms, rewards, progress, and settings"
            onPress={() => open('resetAll')}
            last
          />
        </Card>

        <View style={{height: 8}} />
      </ScrollView>

      {/* Dialogs */}
      <Portal>
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

        <Dialog visible={dialog === 'grindingFor'} onDismiss={close}>
          <Dialog.Title>What are you grinding for?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{color: c.onSurfaceVariant, marginBottom: 16}}>
              This shows on your Progress tab as a daily reminder.
            </Text>
            <TextInput
              mode="outlined"
              value={tempGrinding}
              onChangeText={setTempGrinding}
              placeholder="I'm grinding for…"
              multiline
              numberOfLines={3}
              maxLength={120}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button onPress={saveGrinding}>Save</Button>
          </Dialog.Actions>
        </Dialog>

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
