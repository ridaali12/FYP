// utils/notifications.js  (FRONTEND side)
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://172.21.245.170:5000';

// Notification kaise dikhegi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// Token register karo — app start hone par call karo
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Token backend mein save karo
  const userId = await AsyncStorage.getItem('userId');
  await fetch(`${API_URL}/api/users/save-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, expoPushToken: token }),
  });

  console.log('Push token saved:', token);
};