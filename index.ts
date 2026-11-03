import './unistyles';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
  // The OS draws notification pushes itself while the app is in the background; this must be
  // registered before the app renders or Firebase logs a missing-handler warning for each one.
  setBackgroundMessageHandler(getMessaging(), async () => {});
}

require('expo-router/entry');
