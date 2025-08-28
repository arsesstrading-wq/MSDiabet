const CACHE_NAME = 'royaye-shirin-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/utils.ts',
  '/constants/foodData.ts',
  '/localization/strings.ts',
  '/localization/dynamicStrings.ts',
  '/services/geminiService.ts',
  '/services/googleDriveService.ts',
  '/components/AiAnalysisScreen.tsx',
  '/components/AiToolsScreen.tsx',
  '/components/CarbTableScreen.tsx',
  '/components/ChatbotScreen.tsx',
  '/components/ComprehensiveReportGenerator.tsx',
  '/components/ConfirmationModal.tsx',
  '/components/CorrectionDoseCalculator.tsx',
  '/components/Dashboard.tsx',
  '/components/DiabetesEncyclopediaScreen.tsx',
  '/components/DiabetesIdCardScreen.tsx',
  '/components/EmergencyScreen.tsx',
  '/components/GlucosePredictionCard.tsx',
  '/components/GoalsScreen.tsx',
  '/components/GraphScreen.tsx',
  '/components/Header.tsx',
  '/components/Icons.tsx',
  '/components/InfoModal.tsx',
  '/components/LogActivityScreen.tsx',
  '/components/LogBloodSugarScreen.tsx',
  '/components/LogHistoryScreen.tsx',
  '/components/LogInsulinScreen.tsx',
  '/components/LogMealScreen.tsx',
  '/components/LogMedicationScreen.tsx',
  '/components/LogMoodScreen.tsx',
  '/components/LogPhysicalConditionScreen.tsx',
  '/components/LogSleepScreen.tsx',
  '/components/ProfileScreen.tsx',
  '/components/SettingsScreen.tsx',
  '/components/ToolsScreen.tsx'
];

// Install: Open cache and add shell files to it
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to cache during install:', err);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Implements a stale-while-revalidate strategy.
self.addEventListener('fetch', event => {
  // For non-GET requests, just use the network.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(response => {
          // Fetch from network in the background to update the cache.
          const fetchPromise = fetch(event.request).then(networkResponse => {
            // If we got a valid response, clone it, and cache it.
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          });

          // Return cached response if available, otherwise wait for the network response.
          return response || fetchPromise;
        }).catch(error => {
            console.error('Fetch failed:', error);
            // Fallback for when both cache and network fail.
        })
    })
  );
});

// Listen for push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'رویای شیرین من', body: 'یادآوری!', tag: 'general' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.svg',
      tag: data.tag
    })
  );
});