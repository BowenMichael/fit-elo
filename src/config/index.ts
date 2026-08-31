let extraServerUrl: string | undefined;
let appVersion = '1.0.0';

try {
  const Constants = require('expo-constants').default;
  extraServerUrl = Constants?.expoConfig?.extra?.serverUrl;
  appVersion = Constants?.expoConfig?.version || '1.0.0';
} catch {
  // expo-constants not installed in environment
}

const envServerUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export const Config = {
  SERVER_URL: envServerUrl || extraServerUrl || 'http://localhost:3001',
  IS_DEV: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
  APP_VERSION: appVersion
};
