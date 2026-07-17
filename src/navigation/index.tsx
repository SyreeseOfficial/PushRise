import React from 'react';
import {NavigationContainer, DefaultTheme as NavDefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from 'react-native-paper';
import {navigationRef, RootStackParamList} from './navigationRef';
import CustomTabBar from './CustomTabBar';
import AlarmListScreen from '../screens/alarms/AlarmListScreen';
import AddAlarmScreen from '../screens/alarms/AddAlarmScreen';
import AlarmFiringScreen from '../screens/alarms/AlarmFiringScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import BankCameraScreen from '../screens/progress/BankCameraScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PermissionsScreen from '../screens/settings/PermissionsScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import PaywallScreen from '../screens/paywall/PaywallScreen';
import {useOnboardingStore} from '../store/onboardingStore';
import {useSettingsStore} from '../store/settingsStore';
import {scheduleNudge} from '../utils/notifee';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Alarms" component={AlarmListScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const {hasCompletedOnboarding} = useOnboardingStore();
  const {nudgeEnabled, nudgeHour, nudgeMinute} = useSettingsStore();
  const theme = useTheme();

  React.useEffect(() => {
    if (hasCompletedOnboarding && nudgeEnabled) {
      scheduleNudge(nudgeHour, nudgeMinute).catch(() => {});
    }
  }, [hasCompletedOnboarding]); // reschedule on app open so daily trigger never expires

  const navTheme = {
    ...NavDefaultTheme,
    dark: theme.dark,
    colors: {
      ...NavDefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{gestureEnabled: false}} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="AlarmFiring"
              component={AlarmFiringScreen}
              options={{presentation: 'fullScreenModal', gestureEnabled: false}}
            />
            <Stack.Screen
              name="AddAlarm"
              component={AddAlarmScreen}
              options={{presentation: 'modal'}}
            />
            <Stack.Screen
              name="BankCamera"
              component={BankCameraScreen}
              options={{presentation: 'fullScreenModal', gestureEnabled: false}}
            />
            <Stack.Screen
              name="Permissions"
              component={PermissionsScreen}
              options={{presentation: 'modal'}}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{presentation: 'modal', gestureEnabled: false}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{presentation: 'modal'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
