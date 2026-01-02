/**
 * Canva Designs API
 *
 * Create, read, and export designs from Canva.
 *
 * @see https://www.canva.dev/docs/connect/api-reference/designs/
 */

import { canvaAuth } from './auth';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export interface CanvaDesign {
  id: string;
  title: string;
  owner: {
    user_id: string;
    team_id?: string;
  };
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  urls: {
    edit_url: string;
    view_url: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CanvaDesignCreateRequest {
  design_type?: string;
  title?: string;
  asset_id?: string;  // Start from uploaded asset
  brand_template_id?: string;  // Start from brand template
}

export interface CanvaDesignExportRequest {
  format: 'png' | 'jpg' | 'pdf' | 'gif' | 'mp4' | 'pptx';
  pages?: number[];  // Specific pages to export
  quality?: 'low' | 'medium' | 'high';  // For images
  width?: number;
  height?: number;
}

export interface CanvaExportJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  urls?: string[];
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
      'Content-Type': 'application/json',
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
 * Canva Designs Service
 */
export const canvaDesigns = {
  /**
   * List user's designs
   */
  async list(options?: {
    query?: string;
    ownership?: 'owned' | 'shared' | 'any';
    sort_by?: 'relevance' | 'modified_descending' | 'modified_ascending' | 'title_descending' | 'title_ascending';
    continuation?: string;
  }): Promise<{ designs: CanvaDesign[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.query) params.set('query', options.query);
    if (options?.ownership) params.set('ownership', options.ownership);
    if (options?.sort_by) params.set('sort_by', options.sort_by);
    if (options?.continuation) params.set('continuation', options.continuation);

    const queryString = params.toString();
    const endpoint = `/designs${queryString ? `?${queryString}` : ''}`;

    const response = await canvaFetch<{ items: CanvaDesign[]; continuation?: string }>(endpoint);
    return {
      designs: response.items,
      continuation: response.continuation,
    };
  },

  /**
   * Get a specific design
   */
  async get(designId: string): Promise<CanvaDesign> {
    const response = await canvaFetch<{ design: CanvaDesign }>(`/designs/${designId}`);
    return response.design;
  },

  /**
   * Create a new design
   */
  async create(request: CanvaDesignCreateRequest): Promise<CanvaDesign> {
    const response = await canvaFetch<{ design: CanvaDesign }>('/designs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.design;
  },

  /**
   * Start an export job for a design
   */
  async startExport(
    designId: string,
    request: CanvaDesignExportRequest
  ): Promise<CanvaExportJob> {
    const response = await canvaFetch<{ job: CanvaExportJob }>(
      `/designs/${designId}/exports`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response.job;
  },

  /**
   * Get export job status
   */
  async getExportStatus(designId: string, jobId: string): Promise<CanvaExportJob> {
    const response = await canvaFetch<{ job: CanvaExportJob }>(
      `/designs/${designId}/exports/${jobId}`
    );
    return response.job;
  },

  /**
   * Export design and wait for completion
   */
  async export(
    designId: string,
    request: CanvaDesignExportRequest,
    options?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
    }
  ): Promise<string[]> {
    const maxWait = options?.maxWaitMs || 60000; // 1 minute default
    const pollInterval = options?.pollIntervalMs || 2000; // 2 seconds

    // Start export
    let job = await this.startExport(designId, request);
    const startTime = Date.now();

    // Poll until complete
    while (job.status === 'pending' || job.status === 'in_progress') {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Export timed out');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      job = await this.getExportStatus(designId, job.id);
    }

    if (job.status === 'failed') {
      throw new Error(job.error || 'Export failed');
    }

    return job.urls || [];
  },

  /**
   * Get design edit URL (opens in Canva editor)
   */
  getEditUrl(design: CanvaDesign): string {
    return design.urls.edit_url;
  },

  /**
   * Get design view URL (read-only view)
   */
  getViewUrl(design: CanvaDesign): string {
    return design.urls.view_url;
  },
};

export default canvaDesigns;
