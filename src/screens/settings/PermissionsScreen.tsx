import React, {useCallback, useState} from 'react';
import {View, ScrollView, PermissionsAndroid, Linking, Platform} from 'react-native';
import {Appbar, Text, Button, Surface, Icon, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';

const {Brand = '', Manufacturer = ''} = (Platform.constants as any) ?? {};
const brand = (Brand as string).toLowerCase();
const mfr = (Manufacturer as string).toLowerCase();
const isSamsung = brand === 'samsung' || mfr === 'samsung';
const isXiaomi = ['xiaomi', 'redmi', 'poco'].includes(brand) || mfr === 'xiaomi';

type PermStatus = 'granted' | 'denied' | 'auto' | 'manual';

interface PermState {
  camera: PermStatus;
  notifications: PermStatus;
}

async function checkAll(): Promise<PermState> {
  const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
    ? 'granted' : 'denied';
  const notifGranted =
    parseInt(String(Platform.Version), 10) < 33
      ? true // auto-granted below Android 13
      : await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS' as any);
  return {camera, notifications: notifGranted ? 'granted' : 'denied'};
}

export default function PermissionsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [perms, setPerms] = useState<PermState>({camera: 'denied', notifications: 'denied'});

  useFocusEffect(useCallback(() => {
    checkAll().then(setPerms);
  }, []));

  const grantCamera = async () => {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (result === 'never_ask_again') Linking.openSettings();
    const updated = await checkAll();
    setPerms(updated);
  };

  const grantNotifications = async () => {
    if (parseInt(String(Platform.Version), 10) < 33) return;
    const result = await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any);
    if (result === 'never_ask_again') Linking.openSettings();
    const updated = await checkAll();
    setPerms(updated);
  };

  const c = theme.colors;

  const PermCard = ({
    icon, title, description, status, required, onGrant, grantLabel,
  }: {
    icon: string;
    title: string;
    description: string;
    status: PermStatus;
    required?: boolean;
    onGrant?: () => void;
    grantLabel?: string;
  }) => {
    const granted = status === 'granted' || status === 'auto';
    const isAuto = status === 'auto';
    const isManual = status === 'manual';

    const iconBg = granted ? c.primaryContainer : required ? c.errorContainer : c.secondaryContainer;
    const iconColor = granted ? c.onPrimaryContainer : required ? c.onErrorContainer : c.onSecondaryContainer;
    const badgeBg = granted ? c.primaryContainer : required ? c.errorContainer : c.surfaceVariant;
    const badgeColor = granted ? c.onPrimaryContainer : required ? c.onErrorContainer : c.onSurfaceVariant;
    const badgeLabel = isAuto ? 'Auto-granted' : isManual ? 'Manage in Settings' : granted ? 'Granted' : required ? 'Required' : 'Optional';

    return (
      <Surface elevation={1} style={{borderRadius: 16, marginBottom: 12, padding: 18}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: iconBg,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon source={icon} size={26} color={iconColor} />
          </View>
          <View style={{flex: 1}}>
            <Text variant="titleSmall" style={{fontWeight: '600'}}>{title}</Text>
            <Text variant="bodySmall" style={{color: c.onSurfaceVariant, marginTop: 3, lineHeight: 18}}>
              {description}
            </Text>
          </View>
        </View>

        <View style={{
          marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 5,
            backgroundColor: badgeBg, borderRadius: 100,
          }}>
            <Text variant="labelSmall" style={{color: badgeColor}}>{badgeLabel}</Text>
          </View>
          {onGrant && !granted && (
            <Button mode="contained-tonal" onPress={onGrant} compact style={{borderRadius: 100}}>
              {grantLabel ?? 'Grant Access'}
            </Button>
          )}
          {isManual && (
            <Button mode="contained-tonal" onPress={onGrant} compact style={{borderRadius: 100}}>
              {grantLabel ?? 'Open Settings'}
            </Button>
          )}
        </View>
      </Surface>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: c.background}}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Permissions" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 40}}>
        <Text variant="bodyMedium" style={{color: c.onSurfaceVariant, marginBottom: 20, lineHeight: 22}}>
          PushRise needs these permissions to work properly. Tap to grant any that are missing.
        </Text>

        <Text variant="labelLarge" style={{color: c.primary, marginBottom: 12, fontWeight: '700'}}>
          Required
        </Text>

        <PermCard
          icon="camera-outline"
          title="Camera"
          description="Auto-counts your push-ups using pose detection. Without this, you can only use manual counting."
          status={perms.camera}
          required
          onGrant={grantCamera}
        />

        <PermCard
          icon="bell-outline"
          title="Notifications"
          description="Sends your alarm alerts. Without this, alarms will fire silently with no notification banner."
          status={perms.notifications}
          required
          onGrant={grantNotifications}
        />

        <PermCard
          icon="alarm-check"
          title="Exact Alarms"
          description="Ensures your alarms fire at the exact time you set. Required on Android 12 and above."
          status="manual"
          required
          onGrant={() => Linking.openSettings()}
          grantLabel="Open Settings"
        />

        <PermCard
          icon="battery-charging-outline"
          title="Battery Optimization"
          description="Exempts PushRise from battery restrictions so alarms reliably fire even when your phone is idle."
          status="manual"
          required
          onGrant={() =>
            Linking.sendIntent('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', [
              {key: 'android.provider.extra.APP_PACKAGE', value: 'com.pushrise'},
            ]).catch(() => Linking.openSettings())
          }
          grantLabel="Disable Optimization"
        />

        {(isSamsung || isXiaomi) && (
          <Surface elevation={1} style={{borderRadius: 16, marginBottom: 12, padding: 18}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14}}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: c.tertiaryContainer,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon source="shield-alert-outline" size={26} color={c.onTertiaryContainer} />
              </View>
              <View style={{flex: 1}}>
                <Text variant="titleSmall" style={{fontWeight: '600'}}>
                  {isSamsung ? 'Samsung Extra Step' : 'Xiaomi Extra Step'}
                </Text>
                <Text variant="bodySmall" style={{color: c.onSurfaceVariant, marginTop: 3, lineHeight: 18}}>
                  {isSamsung
                    ? 'Samsung One UI aggressively kills background apps. One more step to make alarms bulletproof.'
                    : 'MIUI blocks apps from auto-starting by default. This must be enabled manually.'}
                </Text>
              </View>
            </View>

            {isSamsung && (
              <View style={{gap: 6, marginBottom: 14}}>
                {[
                  'Open Settings → Apps → PushRise → Battery',
                  'Set to "Unrestricted"',
                  'Then: Settings → Battery and device care → Battery → Background usage limits',
                  'Add PushRise to "Never sleeping apps"',
                ].map((step, i) => (
                  <View key={i} style={{flexDirection: 'row', gap: 10, alignItems: 'flex-start'}}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: c.primaryContainer,
                      alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
                    }}>
                      <Text style={{fontSize: 11, fontWeight: '800', color: c.onPrimaryContainer}}>{i + 1}</Text>
                    </View>
                    <Text variant="bodySmall" style={{color: c.onSurfaceVariant, flex: 1, lineHeight: 18}}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {isXiaomi && (
              <View style={{gap: 6, marginBottom: 14}}>
                {[
                  'Open the Security app on your phone',
                  'Tap "Permissions" → "Autostart"',
                  'Enable the toggle for PushRise',
                  'Also: Settings → Apps → Manage apps → PushRise → Battery saver → "No restrictions"',
                ].map((step, i) => (
                  <View key={i} style={{flexDirection: 'row', gap: 10, alignItems: 'flex-start'}}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: c.primaryContainer,
                      alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
                    }}>
                      <Text style={{fontSize: 11, fontWeight: '800', color: c.onPrimaryContainer}}>{i + 1}</Text>
                    </View>
                    <Text variant="bodySmall" style={{color: c.onSurfaceVariant, flex: 1, lineHeight: 18}}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            <Button
              mode="contained-tonal"
              onPress={() => {
                const intent = isSamsung
                  ? 'com.samsung.android.lool'
                  : 'com.miui.securitycenter';
                Linking.openURL(`intent://#Intent;package=${intent};end`)
                  .catch(() => Linking.openSettings());
              }}
              compact
              style={{borderRadius: 100, alignSelf: 'flex-end'}}>
              {isSamsung ? 'Open Device Care' : 'Open Security App'}
            </Button>
          </Surface>
        )}

        <Text variant="labelLarge" style={{color: c.primary, marginTop: 8, marginBottom: 12, fontWeight: '700'}}>
          Recommended
        </Text>

        <PermCard
          icon="layers-outline"
          title="Display Over Other Apps"
          description="Shows the alarm screen on top of your lock screen. Without this, the alarm may not wake your phone."
          status="manual"
          onGrant={() => Linking.openSettings()}
          grantLabel="Open Settings"
        />

        <Text variant="labelLarge" style={{color: c.primary, marginTop: 8, marginBottom: 12, fontWeight: '700'}}>
          Auto-Granted
        </Text>

        <PermCard
          icon="lock-open-outline"
          title="Wake Lock"
          description="Wakes your phone's screen when an alarm fires."
          status="auto"
        />

        <PermCard
          icon="vibrate"
          title="Vibrate"
          description="Vibrates your phone when an alarm fires."
          status="auto"
        />

        <PermCard
          icon="power-plug-outline"
          title="Receive on Boot"
          description="Reschedules your alarms after your phone restarts so they don't disappear."
          status="auto"
        />
      </ScrollView>
    </View>
  );
}
