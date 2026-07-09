import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
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
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {backgroundColor: '#111', borderTopColor: '#222'},
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#666',
      }}>
      <Tab.Screen
        name="Alarms"
        component={AlarmListScreen}
        options={{tabBarIcon: () => <Text>⏰</Text>}}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{tabBarIcon: () => <Text>📊</Text>}}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{tabBarIcon: () => <Text>🎁</Text>}}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const {hasCompletedOnboarding} = useOnboardingStore();

  return (
    <NavigationContainer ref={navigationRef}>
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
