// Dedicated service worker for Firebase Cloud Messaging push notifications,
// registered at scope /firebase-push/ (see src/lib/push.ts) so it never
// competes with the main PWA service worker (vite-plugin-pwa's sw.js),
// which controls the root scope and handles offline caching. Push delivery
// and showNotification() work regardless of which scope this SW is
// registered at — only fetch interception is scope-limited, and this SW
// intentionally does none of that.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDBc7jprmByDz2a1GR5kkwDay9FVJGH-pY',
  authDomain: 'sensacaogourmet-f08d8.firebaseapp.com',
  projectId: 'sensacaogourmet-f08d8',
  storageBucket: 'sensacaogourmet-f08d8.firebasestorage.app',
  messagingSenderId: '295451762429',
  appId: '1:295451762429:web:a94ea2423e146b02cda894'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Novo Pedido Recebido!';
  const body = (payload.notification && payload.notification.body) || 'Você tem um novo pedido para analisar.';
  const orderId = payload.data && payload.data.orderId;

  self.registration.showNotification(title, {
    body,
    icon: 'https://raw.githubusercontent.com/MichelCriadorFelix/RESTAURANTE-/1975716dd80f7c608f07a4d6ebb4628f6da7d780/public/icon-192.png',
    badge: 'https://raw.githubusercontent.com/MichelCriadorFelix/RESTAURANTE-/1975716dd80f7c608f07a4d6ebb4628f6da7d780/public/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: orderId ? `/admin/orders/${orderId}` : '/admin' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
