/**
 * Canva OAuth 2.0 with PKCE Authentication
 *
 * Implements the authorization code flow with PKCE for secure
 * authentication without exposing client secrets in the browser.
 *
 * @see https://www.canva.dev/docs/connect/authentication/
 */

// Canva OAuth configuration from environment
const CANVA_CLIENT_ID = import.meta.env.VITE_CANVA_CLIENT_ID || '';
const CANVA_CLIENT_SECRET = import.meta.env.VITE_CANVA_CLIENT_SECRET || '';
const CANVA_REDIRECT_URI = import.meta.env.VITE_CANVA_REDIRECT_URI ||
  `${window.location.origin}/auth/callback/canva`;

// Canva OAuth endpoints
const CANVA_AUTH_URL = 'https://www.canva.com/api/oauth/authorize';
const CANVA_TOKEN_URL = 'https://www.canva.com/api/oauth/token';
const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

// Available scopes for Canva Connect API
export const CANVA_SCOPES = [
  'folder:read',
  'folder:write',
  'folder:permission:read',
  'folder:permission:write',
  'design:content:read',
  'design:content:write',
  'design:meta:read',
  'design:permission:read',
  'design:permission:write',
  'asset:read',
  'asset:write',
  'brandtemplate:content:read',
  'brandtemplate:meta:read',
  'profile:read',
  'app:read',
  'app:write',
] as const;

export interface CanvaTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  expires_at?: number; // Calculated expiry timestamp
}

export interface CanvaUser {
  id: string;
  display_name: string;
  email?: string;
}

// Storage keys
const STORAGE_KEYS = {
  TOKENS: 'canva_tokens',
  CODE_VERIFIER: 'canva_code_verifier',
  USER: 'canva_user',
};

/**
 * Generate cryptographically secure code verifier for PKCE
 */
async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode (RFC 4648)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Canva Authentication Service
 */
export const canvaAuth = {
  /**
   * Check if Canva integration is configured
   */
  isConfigured(): boolean {
    return Boolean(CANVA_CLIENT_ID);
  },

  /**
   * Check if user is authenticated with Canva
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    // Check if token is expired
    if (tokens.expires_at && Date.now() >= tokens.expires_at) {
      return false;
    }

    return true;
  },

  /**
   * Get stored tokens
   */
  getStoredTokens(): CanvaTokens | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Store tokens securely
   */
  storeTokens(tokens: CanvaTokens): void {
    // Calculate expiry timestamp
    const tokensWithExpiry = {
      ...tokens,
      expires_at: Date.now() + (tokens.expires_in * 1000),
    };
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokensWithExpiry));
  },

  /**
   * Get stored user info
   */
  getStoredUser(): CanvaUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Store user info
   */
  storeUser(user: CanvaUser): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  /**
   * Clear all Canva auth data
   */
  clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Initiate OAuth flow - returns authorization URL
   */
  async getAuthorizationUrl(): Promise<string> {
    if (!CANVA_CLIENT_ID) {
      throw new Error('Canva Client ID not configured');
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store verifier for token exchange
    localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: CANVA_CLIENT_ID,
      redirect_uri: CANVA_REDIRECT_URI,
      response_type: 'code',
      scope: CANVA_SCOPES.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${CANVA_AUTH_URL}?${params.toString()}`;
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<CanvaTokens> {
    const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);

    if (!codeVerifier) {
      throw new Error('Code verifier not found. Please restart authentication.');
    }

    const response = await fetch(CANVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
        code,
        code_verifier: codeVerifier,
        redirect_uri: CANVA_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error_description || 'Failed to exchange authorization code');
    }

    const tokens: CanvaTokens = await response.json();

    // Store tokens and clean up verifier
    this.storeTokens(tokens);
    localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);

    // Fetch and store user profile
    try {
      const user = await this.fetchUserProfile(tokens.access_token);
      this.storeUser(user);
    } catch (e) {
      console.warn('Failed to fetch Canva user profile:', e);
    }

    return tokens;
  },

  /**
   * Refresh access token
   */
  async refreshTokens(): Promise<CanvaTokens> {
    const currentTokens = this.getStoredTokens();

    if (!currentTokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(CANVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
        refresh_token: currentTokens.refresh_token,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // If refresh fails, clear auth
      if (response.status === 401 || response.status === 400) {
        this.clearAuth();
      }
      throw new Error(error.error_description || 'Failed to refresh token');
    }

    const tokens: CanvaTokens = await response.json();
    this.storeTokens(tokens);

    return tokens;
  },

  /**
   * Get valid access token (refreshes if needed)
   */
  async getAccessToken(): Promise<string> {
    let tokens = this.getStoredTokens();

    if (!tokens) {
      throw new Error('Not authenticated with Canva');
    }

    // Check if token is expired or about to expire (5 min buffer)
    const expiryBuffer = 5 * 60 * 1000;
    if (tokens.expires_at && Date.now() >= tokens.expires_at - expiryBuffer) {
      tokens = await this.refreshTokens();
    }

    return tokens.access_token;
  },

  /**
   * Fetch user profile from Canva
   */
  async fetchUserProfile(accessToken?: string): Promise<CanvaUser> {
    const token = accessToken || await this.getAccessToken();

    const response = await fetch(`${CANVA_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Canva user profile');
    }

    const data = await response.json();
    return {
      id: data.user.id,
      display_name: data.user.display_name,
      email: data.user.email,
    };
  },

  /**
   * Disconnect Canva account
   */
  async disconnect(): Promise<void> {
    // Optionally revoke tokens on Canva's side
    // For now, just clear local storage
    this.clearAuth();
  },
};

export default canvaAuth;
