import { ProvnBrandLoader } from '@/components/common/LoadingStates';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-provn-bg">
      <ProvnBrandLoader size="lg" message="Loading Provn" variant="brand" minDisplayTime={800} />
    </div>
  );
}