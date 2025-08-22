import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function useServiceWorker() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          logger.info('Service Worker registered successfully');

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            logger.info('Service Worker update found');
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  logger.info('New Service Worker available');
                  // Could show a toast here asking user to refresh
                }
              });
            }
          });

          // Handle messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            logger.debug('Message from Service Worker', { data: event.data });
          });

        } catch (error) {
          logger.error('Service Worker registration failed', { error });
        }
      };

      // Register on page load with a small delay to avoid blocking
      setTimeout(() => {
        registerSW();
      }, 100);

      // Register background sync for offline interactions
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          logger.info('Background sync available');
          // Could register sync events here
        }).catch((error) => {
          logger.warn('Service Worker ready check failed', { error });
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