import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('✅ Service Worker registered successfully:', registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Service Worker update found');
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🆕 New Service Worker available');
                  // Could show a toast here asking user to refresh
                }
              });
            }
          });

          // Handle messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('📨 Message from Service Worker:', event.data);
          });

        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      };

      // Register on page load
      registerSW();

      // Register background sync for offline interactions
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          console.log('🔄 Background sync available');
          // Could register sync events here
        });
      }
    }
  }, []);
}

// Helper function for offline interaction queuing
export function queueVideoInteraction(interaction: {
  type: 'like' | 'view' | 'share';
  videoId: string;
  data?: any;
}) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if ('sync' in registration) {
        // Store interaction in IndexedDB for sync later
        const request = indexedDB.open('provn-offline', 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('interactions')) {
            db.createObjectStore('interactions', { keyPath: 'id', autoIncrement: true });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['interactions'], 'readwrite');
          const store = transaction.objectStore('interactions');
          
          store.add({
            ...interaction,
            timestamp: Date.now(),
          });
          
          // Register sync
          (registration as any).sync?.register('video-interaction');
        };
      }
    });
  }
}