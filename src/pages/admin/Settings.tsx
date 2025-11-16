
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useAuth, isAuthDisabled } from '@/hooks/useAuth';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function Settings() {
  const { platforms, isLoading } = usePlatforms();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'platforms' | 'agents' | 'general' | 'auth'>('platforms');

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
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connected Platforms
              </h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blkout-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blkout-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {platform.isConnected ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <XCircle className="text-gray-400" size={24} />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">
                            {platform.name}
                          </h3>
                          {platform.accountHandle && (
                            <p className="text-sm text-gray-600">{platform.accountHandle}</p>
                          )}
                          {platform.lastSync && platform.isConnected && (
                            <p className="text-xs text-gray-500">
                              Last synced: {new Date(platform.lastSync).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        className={`btn text-sm ${
                          platform.isConnected ? 'btn-secondary' : 'btn-primary'
                        }`}
                      >
                        {platform.isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
