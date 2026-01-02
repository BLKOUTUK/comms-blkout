/**
 * Canva Brand Templates API
 *
 * Access and use brand templates for consistent content creation.
 *
 * @see https://www.canva.dev/docs/connect/api-reference/brand-templates/
 */

import { canvaAuth } from './auth';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export interface CanvaBrandTemplate {
  id: string;
  title: string;
  description?: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  created_at: string;
  updated_at: string;
  view_url: string;
}

export interface CanvaBrandTemplateDataset {
  name: string;
  data: Record<string, string | number | boolean>;
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
 * Canva Brand Templates Service
 */
export const canvaBrandTemplates = {
  /**
   * List available brand templates
   */
  async list(options?: {
    query?: string;
    continuation?: string;
  }): Promise<{ templates: CanvaBrandTemplate[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.query) params.set('query', options.query);
    if (options?.continuation) params.set('continuation', options.continuation);

    const queryString = params.toString();
    const endpoint = `/brand-templates${queryString ? `?${queryString}` : ''}`;

    const response = await canvaFetch<{ items: CanvaBrandTemplate[]; continuation?: string }>(endpoint);
    return {
      templates: response.items,
      continuation: response.continuation,
    };
  },

  /**
   * Get a specific brand template
   */
  async get(templateId: string): Promise<CanvaBrandTemplate> {
    const response = await canvaFetch<{ brand_template: CanvaBrandTemplate }>(
      `/brand-templates/${templateId}`
    );
    return response.brand_template;
  },

  /**
   * Get the dataset (fillable fields) for a brand template
   */
  async getDataset(templateId: string): Promise<CanvaBrandTemplateDataset> {
    const response = await canvaFetch<{ dataset: CanvaBrandTemplateDataset }>(
      `/brand-templates/${templateId}/dataset`
    );
    return response.dataset;
  },

  /**
   * Create a design from a brand template
   * Optionally fill in template fields with data
   */
  async createDesign(templateId: string, options?: {
    title?: string;
    data?: Record<string, string | number | boolean>;
  }): Promise<{ design_id: string; edit_url: string }> {
    const body: Record<string, any> = {
      brand_template_id: templateId,
    };

    if (options?.title) {
      body.title = options.title;
    }

    if (options?.data) {
      body.data = options.data;
    }

    const response = await canvaFetch<{ design: { id: string; urls: { edit_url: string } } }>(
      '/designs',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return {
      design_id: response.design.id,
      edit_url: response.design.urls.edit_url,
    };
  },

  /**
   * Create designs for multiple data entries (bulk creation)
   * Useful for creating social media variations
   */
  async createBulkDesigns(templateId: string, entries: {
    title: string;
    data: Record<string, string | number | boolean>;
  }[]): Promise<{ design_id: string; edit_url: string; title: string }[]> {
    const results = await Promise.all(
      entries.map(async (entry) => {
        const result = await this.createDesign(templateId, {
          title: entry.title,
          data: entry.data,
        });
        return {
          ...result,
          title: entry.title,
        };
      })
    );

    return results;
  },
};

export default canvaBrandTemplates;
