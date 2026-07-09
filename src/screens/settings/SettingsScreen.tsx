import React, {useState} from 'react';
import {View, ScrollView} from 'react-native';
import {
  Appbar, Text, List, RadioButton, Button,
  Dialog, Divider, TextInput, useTheme,
} from 'react-native-paper';
import {useThemeStore, type ThemeMode} from '../../store/themeStore';
import {useSettingsStore} from '../../store/settingsStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const {mode, setMode} = useThemeStore();
  const {defaultReps, setDefaultReps} = useSettingsStore();

  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [repsDialogVisible, setRepsDialogVisible] = useState(false);
  const [repsInput, setRepsInput] = useState(String(defaultReps));

  const THEME_LABELS: Record<ThemeMode, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'Follow system',
  };

  const saveReps = () => {
    const n = parseInt(repsInput, 10);
    if (n > 0 && n <= 999) setDefaultReps(n);
    setRepsDialogVisible(false);
  };

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView>
        {/* Appearance */}
        <List.Section title="Appearance">
          <List.Item
            title="Theme"
            description={THEME_LABELS[mode]}
            left={props => <List.Icon {...props} icon="brightness-6" />}
            onPress={() => setThemeDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        {/* Alarm defaults */}
        <List.Section title="Alarm defaults">
          <List.Item
            title="Default push-ups"
            description={`${defaultReps} push-ups for new alarms`}
            left={props => <List.Icon {...props} icon="counter" />}
            onPress={() => { setRepsInput(String(defaultReps)); setRepsDialogVisible(true); }}
          />
        </List.Section>
      </ScrollView>

      {/* Theme picker dialog */}
      <Dialog visible={themeDialogVisible} onDismiss={() => setThemeDialogVisible(false)}>
        <Dialog.Title>Theme</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group
            value={mode}
            onValueChange={v => { setMode(v as ThemeMode); setThemeDialogVisible(false); }}>
            <RadioButton.Item label="Light" value="light" />
            <RadioButton.Item label="Dark" value="dark" />
            <RadioButton.Item label="Follow system" value="system" />
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setThemeDialogVisible(false)}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Default reps dialog */}
      <Dialog visible={repsDialogVisible} onDismiss={() => setRepsDialogVisible(false)}>
        <Dialog.Title>Default push-ups</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, marginBottom: 16}}>
            How many push-ups should new alarms require by default?
          </Text>
          <TextInput
            mode="outlined"
            value={repsInput}
            onChangeText={setRepsInput}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
            autoFocus
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setRepsDialogVisible(false)}>Cancel</Button>
          <Button onPress={saveReps}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </View>
  );
}
