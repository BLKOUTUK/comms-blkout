
import { useState, useEffect, useCallback } from 'react';

export interface SendFoxList {
  id: number;
  name: string;
  subscribers: number;
}

export interface SendFoxStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  accountName: string | null;
  accountEmail: string | null;
  lists: SendFoxList[];
  totalSubscribers: number;
  lastChecked: Date | null;
}

// Known list mappings from the API - friendly display names
const LIST_DISPLAY_NAMES: Record<number, string> = {
  538297: 'BLKOUT Hub (Weekly Engaged)',
  538162: 'Community Circle (Monthly)',
  538296: 'Legacy Subscribers (Mailchimp)',
  591727: 'Coop Founding Members',
  592260: 'Founder Members',
  591703: 'BLKOUT Cooperative Members',
  572573: 'BLKOUT NXT Organiser',
  572572: 'BLKOUT NXT Organisation',
  572571: 'BLKOUT NXT BQM',
  561384: 'BLKOUT NXT Ally',
};

export function useSendFoxStatus() {
  const [status, setStatus] = useState<SendFoxStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
    accountName: null,
    accountEmail: null,
    lists: [],
    totalSubscribers: 0,
    lastChecked: null,
  });

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use the server-side API to check SendFox connection
      const response = await fetch('/api/herald/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendfox_lists' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to SendFox');
      }

      const lists: SendFoxList[] = (data.lists || []).map((list: any) => ({
        id: list.id,
        name: LIST_DISPLAY_NAMES[list.id] || list.name,
        subscribers: list.subscribers || 0,
      }));

      const totalSubscribers = lists.reduce((sum, list) => sum + list.subscribers, 0);

      setStatus({
        isConnected: true,
        isLoading: false,
        error: null,
        accountName: 'BLKOUT UK', // SendFox doesn't return this in lists call
        accountEmail: null,
        lists,
        totalSubscribers,
        lastChecked: new Date(),
      });
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Connection failed',
        lastChecked: new Date(),
      }));
    }
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Sync a subscriber to SendFox
  const syncSubscriber = async (
    email: string,
    firstName?: string,
    lastName?: string,
    listIds?: number[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/herald/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendfox_sync',
          email,
          first_name: firstName,
          last_name: lastName,
          list_ids: listIds || [538297], // Default to BLKOUT Hub
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync subscriber');
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Sync failed'
      };
    }
  };

  // Prepare newsletter for SendFox
  const prepareNewsletter = async (
    editionId: string,
    listId?: number
  ): Promise<{
    success: boolean;
    error?: string;
    campaignUrl?: string;
    instructions?: string[];
    htmlContent?: string;
    subjectLine?: string;
  }> => {
    try {
      const response = await fetch('/api/herald/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendfox_send',
          edition_id: editionId,
          list_id: listId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to prepare newsletter');
      }

      return {
        success: true,
        campaignUrl: data.sendfox_campaign_url,
        instructions: data.instructions,
        htmlContent: data.html_content,
        subjectLine: data.subject_line,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Preparation failed'
      };
    }
  };

  return {
    ...status,
    refresh: checkConnection,
    syncSubscriber,
    prepareNewsletter,
  };
}
