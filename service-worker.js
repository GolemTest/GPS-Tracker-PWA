const CACHE_NAME = 'gps-tracker-v1';
const urlsToCache = [
  './',
  './index.html',
  './audiotest.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Erreur lors de la mise en cache', error);
      })
  );
  // Force le nouveau Service Worker à devenir actif immédiatement
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle immédiatement de toutes les pages
  return self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Ne pas mettre en cache les tuiles de carte (trop nombreuses)
  if (event.request.url.includes('tile.openstreetmap.org')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si la ressource est en cache, la retourner
        if (response) {
          console.log('Service Worker: Chargement depuis le cache', event.request.url);
          return response;
        }
        
        // Sinon, faire une requête réseau
        console.log('Service Worker: Requête réseau', event.request.url);
        return fetch(event.request).then((response) => {
          // Ne pas mettre en cache les réponses invalides
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cloner la réponse
          const responseToCache = response.clone();

          // Mettre en cache pour les prochaines fois
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch((error) => {
        console.error('Service Worker: Erreur de récupération', error);
      })
  );
});