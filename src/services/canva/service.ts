/**
 * Canva Service - High-level integration for BLKOUT Comms
 *
 * Provides simplified methods for common Canva workflows:
 * - Social media content creation
 * - Event graphics generation
 * - Brand-consistent design creation
 * - Asset management
 */

import { canvaAuth, type CanvaTokens, type CanvaUser } from './auth';
import { canvaDesigns, type CanvaDesign, type CanvaDesignExportRequest } from './designs';
import { canvaAssets, type CanvaAsset } from './assets';
import { canvaBrandTemplates, type CanvaBrandTemplate } from './brandTemplates';
import { canvaFolders, type CanvaFolder } from './folders';

export interface CanvaConnectionStatus {
  connected: boolean;
  user: CanvaUser | null;
  configured: boolean;
}

export interface SocialMediaDesignRequest {
  platform: 'instagram-post' | 'instagram-story' | 'facebook-post' | 'twitter-post' | 'linkedin-post';
  title: string;
  templateId?: string;
  data?: Record<string, string>;
}

export interface EventGraphicsRequest {
  eventName: string;
  eventDate: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  templateId?: string;
}

/**
 * Main Canva Service for BLKOUT
 */
export const canvaService = {
  // Re-export sub-services for direct access
  auth: canvaAuth,
  designs: canvaDesigns,
  assets: canvaAssets,
  brandTemplates: canvaBrandTemplates,
  folders: canvaFolders,

  /**
   * Get connection status
   */
  getConnectionStatus(): CanvaConnectionStatus {
    return {
      connected: canvaAuth.isAuthenticated(),
      user: canvaAuth.getStoredUser(),
      configured: canvaAuth.isConfigured(),
    };
  },

  /**
   * Connect to Canva (opens auth flow)
   */
  async connect(): Promise<void> {
    const authUrl = await canvaAuth.getAuthorizationUrl();

    // Open in popup for better UX
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      'canva-auth',
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );
  },

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string): Promise<CanvaTokens> {
    return canvaAuth.exchangeCode(code);
  },

  /**
   * Disconnect from Canva
   */
  async disconnect(): Promise<void> {
    await canvaAuth.disconnect();
  },

  /**
   * Get design size presets for different platforms
   */
  getDesignPresets(): Record<string, { width: number; height: number; name: string }> {
    return {
      'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
      'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
      'instagram-reel': { width: 1080, height: 1920, name: 'Instagram Reel Cover' },
      'facebook-post': { width: 1200, height: 630, name: 'Facebook Post' },
      'facebook-cover': { width: 820, height: 312, name: 'Facebook Cover' },
      'twitter-post': { width: 1600, height: 900, name: 'Twitter Post' },
      'twitter-header': { width: 1500, height: 500, name: 'Twitter Header' },
      'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post' },
      'youtube-thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail' },
      'email-header': { width: 600, height: 200, name: 'Email Header' },
      'event-banner': { width: 1920, height: 1080, name: 'Event Banner' },
      'poster-a4': { width: 2480, height: 3508, name: 'A4 Poster' },
    };
  },

  /**
   * Create social media graphics from template
   */
  async createSocialMediaGraphic(request: SocialMediaDesignRequest): Promise<{
    design: CanvaDesign;
    editUrl: string;
  }> {
    let design: CanvaDesign;

    if (request.templateId) {
      // Create from brand template
      const result = await canvaBrandTemplates.createDesign(request.templateId, {
        title: request.title,
        data: request.data,
      });
      design = await canvaDesigns.get(result.design_id);
    } else {
      // Create blank design with platform dimensions
      const preset = this.getDesignPresets()[request.platform];
      design = await canvaDesigns.create({
        title: request.title,
        design_type: preset ? `custom_${preset.width}x${preset.height}` : undefined,
      });
    }

    return {
      design,
      editUrl: design.urls.edit_url,
    };
  },

  /**
   * Create event graphics package
   */
  async createEventGraphicsPackage(request: EventGraphicsRequest): Promise<{
    designs: { platform: string; design: CanvaDesign; editUrl: string }[];
    folder?: CanvaFolder;
  }> {
    const platforms = ['instagram-post', 'facebook-post', 'twitter-post', 'instagram-story'];
    const designs: { platform: string; design: CanvaDesign; editUrl: string }[] = [];

    // Optionally create a folder for the event
    let folder: CanvaFolder | undefined;
    try {
      folder = await canvaFolders.create({ name: `Event: ${request.eventName}` });
    } catch (e) {
      console.warn('Could not create folder:', e);
    }

    // Create designs for each platform
    for (const platform of platforms) {
      const preset = this.getDesignPresets()[platform];

      const design = await canvaDesigns.create({
        title: `${request.eventName} - ${preset.name}`,
      });

      designs.push({
        platform,
        design,
        editUrl: design.urls.edit_url,
      });

      // Move to folder if created
      if (folder) {
        try {
          await canvaFolders.moveItem(folder.id, design.id, 'design');
        } catch (e) {
          console.warn('Could not move design to folder:', e);
        }
      }
    }

    return { designs, folder };
  },

  /**
   * Export design to image/video
   */
  async exportDesign(
    designId: string,
    format: 'png' | 'jpg' | 'pdf' = 'png',
    quality: 'high' | 'medium' | 'low' = 'high'
  ): Promise<string[]> {
    const request: CanvaDesignExportRequest = {
      format,
      quality,
    };

    return canvaDesigns.export(designId, request);
  },

  /**
   * Upload image to Canva
   */
  async uploadImage(options: {
    file?: File | Blob;
    url?: string;
    name?: string;
  }): Promise<CanvaAsset> {
    return canvaAssets.upload(options);
  },

  /**
   * Get recent designs
   */
  async getRecentDesigns(limit = 20): Promise<CanvaDesign[]> {
    const result = await canvaDesigns.list({
      sort_by: 'modified_descending',
    });
    return result.designs.slice(0, limit);
  },

  /**
   * Search designs
   */
  async searchDesigns(query: string): Promise<CanvaDesign[]> {
    const result = await canvaDesigns.list({ query });
    return result.designs;
  },

  /**
   * Get brand templates
   */
  async getBrandTemplates(): Promise<CanvaBrandTemplate[]> {
    const result = await canvaBrandTemplates.list();
    return result.templates;
  },

  /**
   * Search brand templates
   */
  async searchBrandTemplates(query: string): Promise<CanvaBrandTemplate[]> {
    const result = await canvaBrandTemplates.list({ query });
    return result.templates;
  },

  /**
   * Create design from template with BLKOUT branding
   */
  async createFromTemplate(
    templateId: string,
    title: string,
    customData?: Record<string, string>
  ): Promise<{ design: CanvaDesign; editUrl: string }> {
    const result = await canvaBrandTemplates.createDesign(templateId, {
      title: `BLKOUT: ${title}`,
      data: customData,
    });

    const design = await canvaDesigns.get(result.design_id);

    return {
      design,
      editUrl: result.edit_url,
    };
  },
};

export default canvaService;
