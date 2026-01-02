/**
 * useCanva Hook
 *
 * React hook for integrating Canva into BLKOUT Comms components.
 * Provides authentication status, connection methods, and design operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { canvaService, type CanvaConnectionStatus } from '@/services/canva/service';
import { type CanvaDesign } from '@/services/canva/designs';
import { type CanvaBrandTemplate } from '@/services/canva/brandTemplates';
import { type CanvaUser } from '@/services/canva/auth';

export interface UseCanvaReturn {
  // Connection state
  isConnected: boolean;
  isConfigured: boolean;
  user: CanvaUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => void;

  // Design operations
  getRecentDesigns: () => Promise<CanvaDesign[]>;
  searchDesigns: (query: string) => Promise<CanvaDesign[]>;
  getBrandTemplates: () => Promise<CanvaBrandTemplate[]>;
  createDesign: (title: string, templateId?: string) => Promise<{ design: CanvaDesign; editUrl: string }>;
  exportDesign: (designId: string, format?: 'png' | 'jpg' | 'pdf') => Promise<string[]>;
  openDesignEditor: (design: CanvaDesign) => void;
}

export function useCanva(): UseCanvaReturn {
  const [status, setStatus] = useState<CanvaConnectionStatus>({
    connected: false,
    user: null,
    configured: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on mount
  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = canvaService.getConnectionStatus();
      setStatus(currentStatus);
      setIsLoading(false);
    };

    checkStatus();

    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'oauth_success' && event.data?.platform === 'canva') {
        checkStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await canvaService.connect();
      // Status will be updated by the message listener when callback completes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Canva');
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await canvaService.disconnect();
      setStatus({
        connected: false,
        user: null,
        configured: canvaService.auth.isConfigured(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from Canva');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setStatus(canvaService.getConnectionStatus());
  }, []);

  const getRecentDesigns = useCallback(async () => {
    if (!status.connected) {
      throw new Error('Not connected to Canva');
    }
    return canvaService.getRecentDesigns();
  }, [status.connected]);

  const searchDesigns = useCallback(async (query: string) => {
    if (!status.connected) {
      throw new Error('Not connected to Canva');
    }
    return canvaService.searchDesigns(query);
  }, [status.connected]);

  const getBrandTemplates = useCallback(async () => {
    if (!status.connected) {
      throw new Error('Not connected to Canva');
    }
    return canvaService.getBrandTemplates();
  }, [status.connected]);

  const createDesign = useCallback(async (title: string, templateId?: string) => {
    if (!status.connected) {
      throw new Error('Not connected to Canva');
    }

    if (templateId) {
      return canvaService.createFromTemplate(templateId, title);
    }

    const design = await canvaService.designs.create({ title });
    return {
      design,
      editUrl: design.urls.edit_url,
    };
  }, [status.connected]);

  const exportDesign = useCallback(async (
    designId: string,
    format: 'png' | 'jpg' | 'pdf' = 'png'
  ) => {
    if (!status.connected) {
      throw new Error('Not connected to Canva');
    }
    return canvaService.exportDesign(designId, format);
  }, [status.connected]);

  const openDesignEditor = useCallback((design: CanvaDesign) => {
    window.open(design.urls.edit_url, '_blank');
  }, []);

  return {
    isConnected: status.connected,
    isConfigured: status.configured,
    user: status.user,
    isLoading,
    error,
    connect,
    disconnect,
    refresh,
    getRecentDesigns,
    searchDesigns,
    getBrandTemplates,
    createDesign,
    exportDesign,
    openDesignEditor,
  };
}

export default useCanva;
