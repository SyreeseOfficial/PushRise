import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// Handles alarm events when app is in background/killed
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS || type === EventType.DELIVERED) {
    // App will navigate to AlarmFiring when it comes to foreground
    // via the foreground handler in App.tsx
  }
});

AppRegistry.registerComponent(appName, () => App);
