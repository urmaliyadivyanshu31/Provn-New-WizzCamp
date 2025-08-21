import { ProvnBrandLoader } from '@/components/common/LoadingStates';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-provn-bg">
      <ProvnBrandLoader size="lg" message="Loading community creation" variant="brand" minDisplayTime={600} />
    </div>
  );
}