import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { db } from './firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let _messaging: ReturnType<typeof getMessaging> | null = null;
const getMsg = () => {
  if (!_messaging) { try { _messaging = getMessaging(getApp()); } catch { return null; } }
  return _messaging;
};

export const requestNotificationPermission = async (userId: string): Promise<boolean> => {
  if (!('Notification' in window) || !VAPID_KEY) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    const msg = getMsg();
    if (!msg) return false;
    const token = await getToken(msg, { vapidKey: VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'fcm_tokens', userId), {
        token, userId, updatedAt: serverTimestamp(),
        platform: /android/i.test(navigator.userAgent) ? 'android' : /iphone|ipad/i.test(navigator.userAgent) ? 'ios' : 'web',
      }, { merge: true });
      return true;
    }
  } catch (e) { console.error('FCM error:', e); }
  return false;
};

export const onForegroundMessage = (cb: (payload: any) => void) => {
  const msg = getMsg();
  if (!msg) return () => {};
  return onMessage(msg, cb);
};

// Déclenche l'envoi push en écrivant dans Firestore (lu par une Cloud Function côté serveur)
export const triggerPushNotification = async (payload: {
  title: string; body: string; url: string; tag: string;
}) => {
  try {
    await addDoc(collection(db, 'push_queue'), {
      ...payload, icon: '/pwa-192x192.png',
      createdAt: serverTimestamp(), sent: false,
    });
  } catch {}
};

export const getNotificationStatus = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};
