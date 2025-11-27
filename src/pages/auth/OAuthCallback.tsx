
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSocialConnect } from '@/hooks/useSocialConnect';
import { SocialPlatform } from '@/types/socialsync';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function OAuthCallback() {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useSocialConnect();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || `Authentication failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        return;
      }

      // Map platform string to enum
      const platformMap: Record<string, SocialPlatform> = {
        instagram: SocialPlatform.INSTAGRAM,
        tiktok: SocialPlatform.TIKTOK,
        linkedin: SocialPlatform.LINKEDIN,
        twitter: SocialPlatform.TWITTER,
        youtube: SocialPlatform.YOUTUBE,
      };

      const socialPlatform = platformMap[platform?.toLowerCase() || ''];
      if (!socialPlatform) {
        setStatus('error');
        setMessage(`Unknown platform: ${platform}`);
        return;
      }

      try {
        const success = await handleCallback(socialPlatform, code);

        if (success) {
          setStatus('success');
          setMessage(`Successfully connected to ${socialPlatform}!`);

          // Close popup if opened as popup, otherwise redirect
          if (window.opener) {
            window.opener.postMessage(
              { type: 'oauth_success', platform: socialPlatform },
              window.location.origin
            );
            setTimeout(() => window.close(), 2000);
          } else {
            setTimeout(() => navigate('/admin/settings'), 2000);
          }
        } else {
          setStatus('error');
          setMessage('Failed to complete authentication');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    processCallback();
  }, [platform, searchParams, handleCallback, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-blkout-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connected!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => navigate('/admin/settings')}
              className="btn btn-primary mt-4"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
