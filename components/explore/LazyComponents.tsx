import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load heavy modal components
const TipModalLazy = lazy(() => import('./TipModal'));
const ShareModalLazy = lazy(() => import('./ShareModal').then(module => ({ default: module.ShareModal })));
const LicensingModalLazy = lazy(() => import('./LicensingModal').then(module => ({ default: module.LicensingModal })));
const VideoDetailsModalLazy = lazy(() => import('./VideoDetailsModal').then(module => ({ default: module.VideoDetailsModal })));

// Loading fallback component
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-8">
      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      <p className="mt-2 text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

// HOC for wrapping lazy components with suspense
function withSuspense<P extends object>(Component: ComponentType<P>) {
  return function SuspendedComponent(props: P) {
    return (
      <Suspense fallback={<ModalLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Export wrapped components
export const TipModal = withSuspense(TipModalLazy);
export const ShareModal = withSuspense(ShareModalLazy);
export const LicensingModal = withSuspense(LicensingModalLazy);
export const VideoDetailsModal = withSuspense(VideoDetailsModalLazy);

// For non-modal heavy components, use regular lazy loading
export const LazyVideoPlayer = lazy(() => import('./VideoPlayer').then(module => ({ default: module.VideoPlayer })));
export const LazyVideoOverlay = lazy(() => import('./VideoOverlay').then(module => ({ default: module.VideoOverlay })));

// Simple loading component for video components
export const VideoLoader = () => (
  <div className="absolute inset-0 bg-black flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-white" />
  </div>
);