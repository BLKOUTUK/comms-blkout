// Social Media Publishing Service
// Handles publishing to Instagram, Facebook, and LinkedIn

interface PublishRequest {
  platform: 'instagram' | 'facebook' | 'linkedin';
  caption: string;
  imageUrl?: string;
  link?: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

const META_GRAPH_API = 'https://graph.facebook.com/v18.0';
const LINKEDIN_API = 'https://api.linkedin.com/v2';

// Get credentials from environment
function getMetaCredentials() {
  return {
    accessToken: import.meta.env.VITE_META_ACCESS_TOKEN || '',
    instagramAccountId: import.meta.env.VITE_INSTAGRAM_BUSINESS_ID || '',
    facebookPageId: import.meta.env.VITE_FACEBOOK_PAGE_ID || ''
  };
}

function getLinkedInCredentials() {
  return {
    accessToken: import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN || '',
    organizationId: import.meta.env.VITE_LINKEDIN_ORG_ID || ''
  };
}

// Instagram Publishing (Meta Graph API)
export async function publishToInstagram(request: PublishRequest): Promise<PublishResult> {
  try {
    const { accessToken, instagramAccountId } = getMetaCredentials();

    if (!accessToken || !instagramAccountId) {
      return { success: false, error: 'Missing Meta credentials - check environment variables' };
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `${META_GRAPH_API}/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: request.imageUrl || 'https://blkoutuk.com/og-image.jpg', // Default image if none provided
          caption: request.caption,
          access_token: accessToken
        })
      }
    );

    const container = await containerResponse.json();
    if (container.error) {
      return { success: false, error: container.error.message };
    }

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `${META_GRAPH_API}/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: accessToken
        })
      }
    );

    const result = await publishResponse.json();
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, postId: result.id };
  } catch (error) {
    console.error('Instagram publish error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Facebook Publishing (Meta Graph API)
export async function publishToFacebook(request: PublishRequest): Promise<PublishResult> {
  try {
    const { accessToken, facebookPageId } = getMetaCredentials();

    if (!accessToken || !facebookPageId) {
      return { success: false, error: 'Missing Meta credentials - check environment variables' };
    }

    const response = await fetch(
      `${META_GRAPH_API}/${facebookPageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: request.caption,
          link: request.link,
          access_token: accessToken
        })
      }
    );

    const result = await response.json();
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, postId: result.id };
  } catch (error) {
    console.error('Facebook publish error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// LinkedIn Publishing (LinkedIn UGC API)
export async function publishToLinkedIn(request: PublishRequest): Promise<PublishResult> {
  try {
    const { accessToken, organizationId } = getLinkedInCredentials();

    if (!accessToken || !organizationId) {
      return { success: false, error: 'Missing LinkedIn credentials - check environment variables' };
    }

    const response = await fetch(
      `${LINKEDIN_API}/ugcPosts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: `urn:li:organization:${organizationId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: request.caption
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      }
    );

    const result = await response.json();
    if (result.error || result.status === 'error') {
      return { success: false, error: result.message || 'LinkedIn API error' };
    }

    return { success: true, postId: result.id };
  } catch (error) {
    console.error('LinkedIn publish error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Unified publish function
export async function publishToSocial(request: PublishRequest): Promise<PublishResult> {
  switch (request.platform) {
    case 'instagram':
      return publishToInstagram(request);
    case 'facebook':
      return publishToFacebook(request);
    case 'linkedin':
      return publishToLinkedIn(request);
    default:
      return { success: false, error: `Platform ${request.platform} not supported yet` };
  }
}
