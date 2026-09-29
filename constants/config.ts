import * as Device from 'expo-device';
import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!configuredApiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not configured');
}

export let API_URL = configuredApiUrl.replace(/\/+$/, '');

if (Platform.OS === 'android' && !Device.isDevice && API_URL.includes('localhost')) {
  API_URL = API_URL.replace('localhost', '10.0.2.2');
}

export const WS_URL = API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
