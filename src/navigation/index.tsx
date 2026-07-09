import React from 'react';
import {NavigationContainer, DefaultTheme as NavDefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {navigationRef, RootStackParamList} from './navigationRef';
import AlarmListScreen from '../screens/alarms/AlarmListScreen';
import AddAlarmScreen from '../screens/alarms/AddAlarmScreen';
import AlarmFiringScreen from '../screens/alarms/AlarmFiringScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import BankCameraScreen from '../screens/progress/BankCameraScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import {useOnboardingStore} from '../store/onboardingStore';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 3,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}>
      <Tab.Screen
        name="Alarms"
        component={AlarmListScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <Icon name={focused ? 'alarm' : 'alarm-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <Icon name={focused ? 'chart-bar' : 'chart-bar'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <Icon name={focused ? 'gift' : 'gift-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const {hasCompletedOnboarding} = useOnboardingStore();
  const theme = useTheme();

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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
