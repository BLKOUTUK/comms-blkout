
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useSocialConnect } from '@/hooks/useSocialConnect';
import { useAuth, isAuthDisabled } from '@/hooks/useAuth';
import { SocialPlatform } from '@/types/socialsync';
import { CheckCircle, AlertCircle, Loader2, Settings2, ExternalLink } from 'lucide-react';

// Platform display configuration
const platformConfig = {
  [SocialPlatform.INSTAGRAM]: {
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Share images and reels with your community',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
  },
  [SocialPlatform.TIKTOK]: {
    icon: '🎵',
    color: 'bg-black',
    description: 'Engage younger audiences with short-form video',
    docsUrl: 'https://developers.tiktok.com/doc',
  },
  [SocialPlatform.LINKEDIN]: {
    icon: '💼',
    color: 'bg-blue-700',
    description: 'Professional networking and thought leadership',
    docsUrl: 'https://developer.linkedin.com/',
  },
  [SocialPlatform.TWITTER]: {
    icon: '𝕏',
    color: 'bg-black',
    description: 'Real-time conversations and community updates',
    docsUrl: 'https://developer.twitter.com/',
  },
  [SocialPlatform.YOUTUBE]: {
    icon: '▶️',
    color: 'bg-red-600',
    description: 'Video content and community engagement',
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
};

export function Settings() {
  const { connections, isLoading, error, initiateConnect, disconnect, refreshStatus } = useSocialConnect();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'platforms' | 'agents' | 'general' | 'auth'>('platforms');
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleConnect = async (platform: SocialPlatform) => {
    setConnectingPlatform(platform);
    initiateConnect(platform);
    // Reset after a timeout (user will be redirected or popup will handle)
    setTimeout(() => setConnectingPlatform(null), 5000);
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    if (window.confirm(`Are you sure you want to disconnect ${platform}?`)) {
      await disconnect(platform);
    }
  };

  const tabs = [
    { id: 'platforms', label: 'Platform Connections' },
    { id: 'agents', label: 'Agent Configuration' },
    { id: 'general', label: 'General Settings' },
    { id: 'auth', label: 'Authentication' },
  ] as const;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your BLKOUT communications system
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blkout-600 text-blkout-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Platform Connections Tab */}
        {activeTab === 'platforms' && (
          <div className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="card bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900">Connection Error</h3>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Cards */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Social Media Connections
                </h2>
                <button
                  onClick={() => refreshStatus()}
                  disabled={isLoading}
                  className="btn btn-outline text-sm"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Refresh'}
                </button>
              </div>

              {isLoading && connections.size === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="inline-block animate-spin h-8 w-8 text-blkout-600" />
                  <p className="mt-2 text-gray-600">Loading platform status...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(SocialPlatform).map((platform) => {
                    const connection = connections.get(platform);
                    const config = platformConfig[platform];
                    const isConnecting = connectingPlatform === platform;

                    return (
                      <div
                        key={platform}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                          connection?.isConnected
                            ? 'border-green-200 bg-green-50'
                            : connection?.isConfigured
                            ? 'border-gray-200 hover:border-blkout-300'
                            : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                            {config.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{platform}</h3>
                              {connection?.isConnected && (
                                <CheckCircle className="text-green-600" size={16} />
                              )}
                              {!connection?.isConfigured && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                  Not configured
                                </span>
                              )}
                            </div>
                            {connection?.accountName ? (
                              <p className="text-sm text-gray-600">@{connection.accountName}</p>
                            ) : (
                              <p className="text-sm text-gray-500">{config.description}</p>
                            )}
                            {connection?.lastSync && (
                              <p className="text-xs text-gray-400 mt-1">
                                Last synced: {connection.lastSync.toLocaleString()}
                              </p>
                            )}
                            {connection?.error && (
                              <p className="text-xs text-red-600 mt-1">{connection.error}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!connection?.isConfigured && (
                            <a
                              href={config.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline text-xs"
                            >
                              <Settings2 size={14} />
                              Setup Guide
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {connection?.isConfigured && (
                            <button
                              onClick={() =>
                                connection.isConnected
                                  ? handleDisconnect(platform)
                                  : handleConnect(platform)
                              }
                              disabled={isConnecting}
                              className={`btn text-sm ${
                                connection.isConnected ? 'btn-secondary' : 'btn-primary'
                              }`}
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 className="animate-spin" size={16} />
                                  Connecting...
                                </>
                              ) : connection.isConnected ? (
                                'Disconnect'
                              ) : (
                                'Connect'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Setup Instructions */}
            <div className="card bg-blkout-50 border-blkout-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Setting Up Social Media Connections
              </h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-blkout-900 mb-2">1. Create Developer App</h4>
                  <p>
                    Each platform requires you to create a developer app to get API credentials.
                    Click the "Setup Guide" button next to any platform for documentation.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-blkout-900 mb-2">2. Add Credentials to .env</h4>
                  <pre className="bg-white p-3 rounded border border-blkout-200 overflow-x-auto text-xs">
{`# Instagram/Facebook
VITE_INSTAGRAM_CLIENT_ID=your_app_id
VITE_INSTAGRAM_CLIENT_SECRET=your_app_secret
VITE_INSTAGRAM_REDIRECT_URI=${window.location.origin}/auth/callback/instagram

# TikTok
VITE_TIKTOK_CLIENT_KEY=your_client_key
VITE_TIKTOK_CLIENT_SECRET=your_client_secret`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-blkout-900 mb-2">3. Connect Account</h4>
                  <p>
                    Once credentials are configured, click "Connect" to authorize BLKOUT to
                    post on your behalf. You can disconnect at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Configuration Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Agent Configuration
              </h2>
              <div className="space-y-4">
                {['Griot', 'Listener', 'Weaver', 'Strategist'].map((agent) => (
                  <div
                    key={agent}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{agent}</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blkout-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blkout-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content Generation Frequency
                        </label>
                        <select className="input">
                          <option>Every 4 hours</option>
                          <option>Every 8 hours</option>
                          <option>Daily</option>
                          <option>Manual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auto-Approve
                        </label>
                        <select className="input">
                          <option>Require manual review</option>
                          <option>Auto-approve all</option>
                          <option>Auto-approve with confidence {'>'}90%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                General Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="BLKOUT UK"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Timezone
                  </label>
                  <select className="input">
                    <option>Europe/London (GMT)</option>
                    <option>America/New_York (EST)</option>
                    <option>America/Los_Angeles (PST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Notifications
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">New drafts for review</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Content published</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Daily summary</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Tab */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            {isAuthDisabled() && (
              <div className="card bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Authentication is Currently Disabled
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      The system is running in development mode with authentication disabled.
                      You are logged in as a mock admin user.
                    </p>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <p><strong>Mock User:</strong> {user?.email}</p>
                      <p><strong>Role:</strong> {user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Authentication Configuration
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Enabling Authentication
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Set up your Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blkout-600 hover:underline">supabase.com</a></li>
                    <li>Copy your project URL and anon key</li>
                    <li>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file based on <code className="bg-gray-200 px-1 rounded">.env.example</code></li>
                    <li>Set <code className="bg-gray-200 px-1 rounded">VITE_AUTH_DISABLED=false</code></li>
                    <li>Add your Supabase credentials</li>
                    <li>Restart the development server</li>
                  </ol>
                </div>

                <div className="p-4 bg-blkout-50 rounded-lg border border-blkout-200">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Environment Variables
                  </h3>
                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_AUTH_DISABLED=false`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
