// Service Worker Firebase Cloud Messaging — Assistant Rhumato
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Config Firebase (même valeurs que src/services/firebase.ts)
// Ces valeurs sont publiques — pas de secret ici
firebase.initializeApp({
  apiKey: "VITE_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: "VITE_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: "VITE_FIREBASE_APP_ID_PLACEHOLDER",
});

const messaging = firebase.messaging();

// Gestion des notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};
  const notifTitle = title || 'Assistant Rhumato';
  const notifOptions = {
    body: body || 'Nouvelle publication',
    icon: icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data?.tag || 'ar-notif',
    data: data || {},
    actions: [{ action: 'open', title: 'Voir' }],
    requireInteraction: false,
  };
  self.registration.showNotification(notifTitle, notifOptions);
});

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
