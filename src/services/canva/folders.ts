/**
 * Canva Folders API
 *
 * Organize designs and assets in folders.
 *
 * @see https://www.canva.dev/docs/connect/api-reference/folders/
 */

import { canvaAuth } from './auth';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export interface CanvaFolder {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
}

export interface CanvaFolderItem {
  type: 'design' | 'folder' | 'image' | 'video';
  design?: {
    id: string;
    title: string;
    thumbnail?: { url: string };
  };
  folder?: {
    id: string;
    name: string;
  };
  image?: {
    id: string;
    thumbnail?: { url: string };
  };
  video?: {
    id: string;
    thumbnail?: { url: string };
  };
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
 * Canva Folders Service
 */
export const canvaFolders = {
  /**
   * List user's folders
   */
  async list(options?: {
    continuation?: string;
  }): Promise<{ folders: CanvaFolder[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.continuation) params.set('continuation', options.continuation);

    const queryString = params.toString();
    const endpoint = `/folders${queryString ? `?${queryString}` : ''}`;

    const response = await canvaFetch<{ items: CanvaFolder[]; continuation?: string }>(endpoint);
    return {
      folders: response.items,
      continuation: response.continuation,
    };
  },

  /**
   * Get a specific folder
   */
  async get(folderId: string): Promise<CanvaFolder> {
    const response = await canvaFetch<{ folder: CanvaFolder }>(`/folders/${folderId}`);
    return response.folder;
  },

  /**
   * Create a new folder
   */
  async create(options: {
    name: string;
    parent_folder_id?: string;
  }): Promise<CanvaFolder> {
    const response = await canvaFetch<{ folder: CanvaFolder }>('/folders', {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.folder;
  },

  /**
   * Update folder name
   */
  async update(folderId: string, options: {
    name: string;
  }): Promise<CanvaFolder> {
    const response = await canvaFetch<{ folder: CanvaFolder }>(`/folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify(options),
    });
    return response.folder;
  },

  /**
   * Delete a folder
   */
  async delete(folderId: string): Promise<void> {
    await canvaFetch(`/folders/${folderId}`, {
      method: 'DELETE',
    });
  },

  /**
   * List items in a folder
   */
  async listItems(folderId: string, options?: {
    item_types?: ('design' | 'folder' | 'image' | 'video')[];
    continuation?: string;
  }): Promise<{ items: CanvaFolderItem[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.item_types) params.set('item_types', options.item_types.join(','));
    if (options?.continuation) params.set('continuation', options.continuation);

    const queryString = params.toString();
    const endpoint = `/folders/${folderId}/items${queryString ? `?${queryString}` : ''}`;

    const response = await canvaFetch<{ items: CanvaFolderItem[]; continuation?: string }>(endpoint);
    return response;
  },

  /**
   * Move item to folder
   */
  async moveItem(folderId: string, itemId: string, itemType: 'design' | 'folder' | 'asset'): Promise<void> {
    await canvaFetch(`/folders/${folderId}/items`, {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        item_type: itemType,
      }),
    });
  },

  /**
   * Remove item from folder
   */
  async removeItem(folderId: string, itemId: string, itemType: 'design' | 'folder' | 'asset'): Promise<void> {
    await canvaFetch(`/folders/${folderId}/items/${itemType}/${itemId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create a BLKOUT campaign folder structure
   */
  async createCampaignStructure(campaignName: string): Promise<{
    root: CanvaFolder;
    subfolders: Record<string, CanvaFolder>;
  }> {
    // Create root campaign folder
    const root = await this.create({ name: `BLKOUT: ${campaignName}` });

    // Create standard subfolders for BLKOUT campaigns
    const subfolderNames = [
      'Social Media Graphics',
      'Event Banners',
      'Email Headers',
      'Story Templates',
      'Print Materials',
      'Assets & Logos',
    ];

    const subfolders: Record<string, CanvaFolder> = {};

    for (const name of subfolderNames) {
      const folder = await this.create({
        name,
        parent_folder_id: root.id,
      });
      subfolders[name] = folder;
    }

    return { root, subfolders };
  },
};

export default canvaFolders;
