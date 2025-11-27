
/**
 * SendFox API Integration Service
 *
 * SendFox is a cost-effective email marketing platform for creators.
 * API Documentation: https://sendfox.com/api
 *
 * Note: SendFox's API does NOT support programmatic campaign sending.
 * The workflow is:
 * 1. Herald agent generates newsletter content
 * 2. Admin reviews and approves
 * 3. HTML is exported/copied to SendFox web interface
 * 4. Admin manually sends via SendFox dashboard
 * 5. Metrics are logged back to our database
 */

const SENDFOX_API_BASE = 'https://api.sendfox.com';

interface SendFoxContact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  lists: number[];
  unsubscribed_at: string | null;
}

interface SendFoxList {
  id: number;
  name: string;
}

interface SendFoxMe {
  id: number;
  name: string;
  email: string;
}

export interface SendFoxSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  listIds: number[];
}

class SendFoxService {
  private accessToken: string | null = null;

  constructor() {
    // Token should be set via environment variable or configuration
    this.accessToken = import.meta.env.VITE_SENDFOX_ACCESS_TOKEN || null;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private getHeaders(): HeadersInit {
    if (!this.accessToken) {
      throw new Error('SendFox access token not configured');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Verify API connection and get account info
   */
  async getMe(): Promise<SendFoxMe | null> {
    try {
      const response = await fetch(`${SENDFOX_API_BASE}/me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error('SendFox API error:', response.status, await response.text());
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to connect to SendFox:', error);
      return null;
    }
  }

  /**
   * Get all mailing lists
   */
  async getLists(): Promise<SendFoxList[]> {
    try {
      const response = await fetch(`${SENDFOX_API_BASE}/lists`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch SendFox lists:', error);
      return [];
    }
  }

  /**
   * Create a new subscriber/contact
   */
  async createContact(subscriber: SendFoxSubscriber): Promise<SendFoxContact | null> {
    try {
      const response = await fetch(`${SENDFOX_API_BASE}/contacts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: subscriber.email,
          first_name: subscriber.firstName || '',
          last_name: subscriber.lastName || '',
          lists: subscriber.listIds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create contact:', errorText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create SendFox contact:', error);
      return null;
    }
  }

  /**
   * Unsubscribe a contact by email
   */
  async unsubscribe(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${SENDFOX_API_BASE}/unsubscribe`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to unsubscribe contact:', error);
      return false;
    }
  }

  /**
   * Get paginated contacts from a list
   */
  async getContacts(page: number = 1): Promise<{ contacts: SendFoxContact[]; hasMore: boolean }> {
    try {
      const response = await fetch(`${SENDFOX_API_BASE}/contacts?page=${page}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }

      const data = await response.json();
      return {
        contacts: data.data || [],
        hasMore: data.current_page < data.last_page,
      };
    } catch (error) {
      console.error('Failed to fetch SendFox contacts:', error);
      return { contacts: [], hasMore: false };
    }
  }

  /**
   * Sync a subscriber to SendFox
   * Creates contact if new, updates list membership
   */
  async syncSubscriber(subscriber: SendFoxSubscriber): Promise<{
    success: boolean;
    contactId?: number;
    error?: string;
  }> {
    try {
      const contact = await this.createContact(subscriber);

      if (contact) {
        return { success: true, contactId: contact.id };
      }

      return { success: false, error: 'Failed to create/update contact' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if SendFox is configured
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }
}

// Export singleton instance
export const sendfox = new SendFoxService();

// Export types
export type { SendFoxContact, SendFoxList, SendFoxMe };

/**
 * Hook-friendly wrapper for React components
 */
export function useSendFox() {
  const isConfigured = sendfox.isConfigured();

  return {
    isConfigured,
    getMe: () => sendfox.getMe(),
    getLists: () => sendfox.getLists(),
    createContact: (subscriber: SendFoxSubscriber) => sendfox.createContact(subscriber),
    unsubscribe: (email: string) => sendfox.unsubscribe(email),
    syncSubscriber: (subscriber: SendFoxSubscriber) => sendfox.syncSubscriber(subscriber),
  };
}
