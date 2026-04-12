// Shared API URL used throughout the app.
// The value can be configured in a few ways:
// 1. Hard‑code the local network address of your backend (e.g.
//    `http://192.168.100.2:5000`) when running on a real device.
// 2. Add an `extra.backendUrl` field in `app.json` and Expo will
//    expose it via `Constants.expoConfig.extra.backendUrl`.
// 3. When running in Expo Go the packager sets `debuggerHost` which
//    we can use to infer the development machine’s IP automatically.

import Constants from 'expo-constants';

// derive default host from debuggerHost (works in Expo Go) or fallback
const defaultHost = Constants.manifest?.debuggerHost
  ? `http://${Constants.manifest.debuggerHost.split(':')[0]}:5000`
  : 'http://192.168.100.2:5000';

export const API_URL = Constants.expoConfig?.extra?.backendUrl || defaultHost;
