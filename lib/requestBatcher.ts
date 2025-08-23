// Request batching utility for performance optimization
interface BatchRequest {
  id: string;
  resolver: (data: any) => void;
  rejector: (error: any) => void;
}

class RequestBatcher {
  private batches: Map<string, BatchRequest[]> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly batchDelay: number = 50; // 50ms batch window
  private readonly maxBatchSize: number = 10;

  async batchRequest<T>(
    batchKey: string,
    requestId: string,
    fetchFunction: (ids: string[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Get or create batch for this key
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      batch.push({
        id: requestId,
        resolver: resolve,
        rejector: reject,
      });

      // Execute immediately if batch is full
      if (batch.length >= this.maxBatchSize) {
        this.executeBatch(batchKey, fetchFunction);
        return;
      }

      // Schedule batch execution
      if (this.timeouts.has(batchKey)) {
        clearTimeout(this.timeouts.get(batchKey)!);
      }

      const timeout = setTimeout(() => {
        this.executeBatch(batchKey, fetchFunction);
      }, this.batchDelay);

      this.timeouts.set(batchKey, timeout);
    });
  }

  private async executeBatch<T>(
    batchKey: string,
    fetchFunction: (ids: string[]) => Promise<T[]>
  ) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Clear timeout and remove batch
    if (this.timeouts.has(batchKey)) {
      clearTimeout(this.timeouts.get(batchKey)!);
      this.timeouts.delete(batchKey);
    }
    this.batches.delete(batchKey);

    try {
      const ids = batch.map((req) => req.id);
      const results = await fetchFunction(ids);

      // Resolve each request with its corresponding result
      batch.forEach((request, index) => {
        const result = results.find((r: any) => r.id === request.id) || results[index];
        request.resolver(result);
      });
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach((request) => {
        request.rejector(error);
      });
    }
  }

  // Clear all pending batches (useful for cleanup)
  clearAll() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
    this.batches.forEach((batch) => {
      batch.forEach((request) => {
        request.rejector(new Error('Request cancelled'));
      });
    });
    this.batches.clear();
  }
}

// Global instance
export const requestBatcher = new RequestBatcher();

// Specific batchers for different types of requests
export const videoBatcher = {
  // Batch video metadata requests
  async getVideoMetrics(videoId: string) {
    return requestBatcher.batchRequest(
      'video-metrics',
      videoId,
      async (videoIds: string[]) => {
        const response = await fetch('/api/videos/batch-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video metrics: ${response.statusText}`);
        }
        
        return response.json();
      }
    );
  },

  // Batch like status checks
  async getLikeStatus(videoId: string, userWallet: string) {
    const key = `like-status-${userWallet}`;
    return requestBatcher.batchRequest(
      key,
      videoId,
      async (videoIds: string[]) => {
        const response = await fetch('/api/videos/batch-likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds, userWallet }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch like status: ${response.statusText}`);
        }
        
        return response.json();
      }
    );
  },

  // Batch video views
  async recordViews(views: Array<{ videoId: string; duration?: number; percentage?: number }>) {
    // Don't batch views, but optimize with debouncing
    const response = await fetch('/api/videos/batch-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ views }),
    });
    
    return response.ok;
  },
};

// Profile data batcher
export const profileBatcher = {
  async getProfile(walletAddress: string) {
    return requestBatcher.batchRequest(
      'profiles',
      walletAddress,
      async (walletAddresses: string[]) => {
        const response = await fetch('/api/profiles/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddresses }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profiles: ${response.statusText}`);
        }
        
        return response.json();
      }
    );
  },
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestBatcher.clearAll();
  });
}