import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app, db } from './firebase';

// From Firebase Console > Project Settings > Cloud Messaging > Web Push
// certificates. This is a public key (safe to ship in client code) — it
// identifies which Firebase project a push subscription belongs to, it
// does not grant any send capability by itself.
const VAPID_KEY = 'BJNcHaOgLdFUvNk9brB6A9nfn2wGrgmmUqe2lyIT3pj_mPgshEgHXPC-attmhtTid5ak_LDG5xzL9hc7P6IMJsA';

// Registers this browser to receive push notifications for new orders and
// stores the resulting token on the admin's user doc, so the
// api/notify-new-order serverless function knows where to send pushes.
// Safe to call repeatedly (e.g. on every dashboard mount) — getToken()
// returns the same token for an already-registered browser.
export async function registerPushForAdmin(uid: string) {
  try {
    if (!VAPID_KEY) return; // not configured yet
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!(await isSupported())) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/firebase-push/firebase-messaging-sw.js', {
      scope: '/firebase-push/',
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) });
    }
  } catch (e) {
    console.error('Failed to register push notifications', e);
  }
}

// Fire-and-forget call to let the admin(s) know a new order came in, even
// if their app is closed/backgrounded. Never throws — a failure here
// should not block checkout, since the order itself is already saved.
export async function notifyAdminsOfNewOrder(orderId: string) {
  try {
    await fetch('/api/notify-new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
  } catch (e) {
    console.error('Failed to notify admins of new order', e);
  }
}
