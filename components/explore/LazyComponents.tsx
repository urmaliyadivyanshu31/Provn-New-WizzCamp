import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';
import { ProvnBrandLoader } from '@/components/common/LoadingStates';

// Lazy load heavy modal components
const TipModalLazy = lazy(() => import('./TipModal')); // Default export
const ShareModalLazy = lazy(() => import('./ShareModal').then(module => ({ default: module.ShareModal })));
const LicensingModalLazy = lazy(() => import('./LicensingModal').then(module => ({ default: module.LicensingModal })));
const VideoDetailsModalLazy = lazy(() => import('./VideoDetailsModal').then(module => ({ default: module.VideoDetailsModal })));

// Premium Modal Loading
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
    <div className="bg-provn-surface rounded-2xl p-8 border border-provn-border">
      <ProvnBrandLoader size="default" message="Loading..." variant="brand" />
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

// Premium Video Loading Component
export const VideoLoader = () => (
  <div className="absolute inset-0 bg-black flex items-center justify-center">
    <ProvnBrandLoader size="lg" message="Loading video..." variant="brand" />
  </div>
);