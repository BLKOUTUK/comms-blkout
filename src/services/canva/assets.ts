/**
 * Canva Assets API
 *
 * Upload and manage assets (images, videos) in Canva.
 *
 * @see https://www.canva.dev/docs/connect/api-reference/assets/
 */

import { canvaAuth } from './auth';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export interface CanvaAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface CanvaAssetUploadJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  asset?: CanvaAsset;
  error?: string;
}

/**
 * Make authenticated API request to Canva
 */
async function canvaFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await canvaAuth.getAccessToken();

  const response = await fetch(`${CANVA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Canva API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Canva Assets Service
 */
export const canvaAssets = {
  /**
   * List user's assets
   */
  async list(options?: {
    types?: ('image' | 'video')[];
    continuation?: string;
  }): Promise<{ assets: CanvaAsset[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.types) params.set('types', options.types.join(','));
    if (options?.continuation) params.set('continuation', options.continuation);

    const queryString = params.toString();
    const endpoint = `/assets${queryString ? `?${queryString}` : ''}`;

    const response = await canvaFetch<{ items: CanvaAsset[]; continuation?: string }>(endpoint);
    return {
      assets: response.items,
      continuation: response.continuation,
    };
  },

  /**
   * Get a specific asset
   */
  async get(assetId: string): Promise<CanvaAsset> {
    const response = await canvaFetch<{ asset: CanvaAsset }>(`/assets/${assetId}`);
    return response.asset;
  },

  /**
   * Upload an asset from a URL
   */
  async uploadFromUrl(options: {
    url: string;
    name?: string;
  }): Promise<CanvaAssetUploadJob> {
    const response = await canvaFetch<{ job: CanvaAssetUploadJob }>('/asset-uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset_upload_metadata: {
          name_hint: options.name,
        },
        image: {
          url: options.url,
        },
      }),
    });
    return response.job;
  },

  /**
   * Upload an asset from a File/Blob
   */
  async uploadFile(options: {
    file: File | Blob;
    name?: string;
  }): Promise<CanvaAssetUploadJob> {
    const accessToken = await canvaAuth.getAccessToken();

    // Create form data
    const formData = new FormData();
    formData.append('file', options.file, options.name || 'upload');

    if (options.name) {
      formData.append('asset_upload_metadata', JSON.stringify({
        name_hint: options.name,
      }));
    }

    const response = await fetch(`${CANVA_API_BASE}/asset-uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.job;
  },

  /**
   * Get upload job status
   */
  async getUploadStatus(jobId: string): Promise<CanvaAssetUploadJob> {
    const response = await canvaFetch<{ job: CanvaAssetUploadJob }>(
      `/asset-uploads/${jobId}`
    );
    return response.job;
  },

  /**
   * Upload and wait for completion
   */
  async upload(options: {
    file?: File | Blob;
    url?: string;
    name?: string;
    maxWaitMs?: number;
    pollIntervalMs?: number;
  }): Promise<CanvaAsset> {
    if (!options.file && !options.url) {
      throw new Error('Either file or url must be provided');
    }

    const maxWait = options.maxWaitMs || 60000;
    const pollInterval = options.pollIntervalMs || 2000;

    // Start upload
    let job: CanvaAssetUploadJob;
    if (options.file) {
      job = await this.uploadFile({ file: options.file, name: options.name });
    } else {
      job = await this.uploadFromUrl({ url: options.url!, name: options.name });
    }

    const startTime = Date.now();

    // Poll until complete
    while (job.status === 'pending' || job.status === 'in_progress') {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Upload timed out');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      job = await this.getUploadStatus(job.id);
    }

    if (job.status === 'failed') {
      throw new Error(job.error || 'Upload failed');
    }

    if (!job.asset) {
      throw new Error('Upload completed but no asset returned');
    }

    return job.asset;
  },

  /**
   * Delete an asset
   */
  async delete(assetId: string): Promise<void> {
    await canvaFetch(`/assets/${assetId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update asset metadata
   */
  async update(assetId: string, updates: {
    name?: string;
    tags?: string[];
  }): Promise<CanvaAsset> {
    const response = await canvaFetch<{ asset: CanvaAsset }>(`/assets/${assetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.asset;
  },
};

export default canvaAssets;
