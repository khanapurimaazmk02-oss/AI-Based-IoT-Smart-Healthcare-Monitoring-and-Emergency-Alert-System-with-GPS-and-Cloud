// firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: This file MUST be served from the ROOT of your web server
//            e.g. https://yourdomain.com/firebase-messaging-sw.js
//            Place it alongside index.html in your hosting root.
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

// Must match firebaseConfig in index.html exactly
firebase.initializeApp({
    apiKey: 'AIzaSyDfwHe6KqjN1cMRI_FlWXNsbPkBNuayt7w',
    authDomain: 'iot-patient-health-monit-c67f6.firebaseapp.com',
    databaseURL: 'https://iot-patient-health-monit-c67f6-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'iot-patient-health-monit-c67f6',
    storageBucket: 'iot-patient-health-monit-c67f6.appspot.com',
    messagingSenderId: '415116190308',
    appId: '1:415116190308:web:03849521cd4846324af571'
});

const messaging = firebase.messaging();

// ── Background message handler ─────────────────────────────────────────────
// Fires when a push notification arrives and the app tab is NOT in focus.
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const title = payload.notification?.title || 'MediMonitor Alert';
    const body = payload.notification?.body || 'Check patient vitals now.';
    const icon = payload.notification?.icon || '/icon-192.png';

    self.registration.showNotification(title, {
        body,
        icon,
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        actions: [
            { action: 'open', title: '📊 Open Dashboard' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    });
});

// ── Notification click handler ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    // Focus existing tab or open a new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// ── PWA Fetch Handler (Required for Installability) ────────────────────────
self.addEventListener('fetch', (event) => {
    // Basic pass-through for now. Can be expanded for offline caching.
    event.respondWith(fetch(event.request).catch(() => new Response('Offline Mode')));
});
