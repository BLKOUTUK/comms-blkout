
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAgents } from '@/hooks/useAgents';
import { supabase } from '@/lib/supabase';
import { Bot, ExternalLink, Loader2, User } from 'lucide-react';

// Cut to what persists (3 Sep 2026). The previous page had a Platforms tab reading a
// table that does not exist, a Canva tab for a browser-side OAuth flow whose secret is
// no longer in the client, an Agents tab with four hardcoded names and toggles that
// wrote nothing, a "Save Changes" button with no handler, and developer onboarding copy
// telling people to put client secrets in VITE_ variables. What remains reads and
// writes agent_configurations, and says where the retired controls' jobs are done.

const HOMES: { what: string; where: string; href?: string; internal?: boolean }[] = [
  { what: 'Posting to social platforms', where: 'the Zapier routines — see the posting playbook' },
  { what: 'Branded images and video', where: 'the blkout-image-gen skill, and Canva itself', href: 'https://www.canva.com' },
  { what: 'Newsletter editions', where: 'the blkout-newsletter skill; sending is SendFox', href: 'https://sendfox.com' },
  { what: 'Sign-in and password', where: 'your account page', href: '/admin/account', internal: true },
];

export function Settings() {
  const { agents, isLoading, error, refetch } = useAgents();
  const [busy, setBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggle = async (agentType: string, currentlyActive: boolean) => {
    setBusy(agentType);
    setSaveError(null);
    const { error: updateError } = await supabase
      .from('agent_configurations')
      .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
      .eq('agent_name', agentType);
    setBusy(null);
    if (updateError) {
      setSaveError(`${agentType}: ${updateError.message}`);
      return;
    }
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Only things that persist live here</p>
        </div>

        {/* Agents — reads and writes agent_configurations */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Bot size={20} className="text-blkout-600" />
            Agents
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enabled agents can be given tasks on the Agents page. Changes are saved to the database immediately.
          </p>
          {isLoading && (
            <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading agents…</p>
          )}
          {error && !isLoading && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Agents unavailable: {error}</p>
          )}
          {saveError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">Save FAILED — {saveError}</p>
          )}
          <div className="divide-y divide-gray-100">
            {agents.map((agent) => {
              const active = agent.status === 'active';
              return (
                <div key={agent.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{agent.type}{agent.description ? ` · ${agent.description}` : ''}</p>
                  </div>
                  <button
                    onClick={() => toggle(agent.type, active)}
                    disabled={busy === agent.type}
                    className={`btn text-sm ${active ? 'btn-outline' : 'btn-primary'}`}
                  >
                    {busy === agent.type ? 'Saving…' : active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              );
            })}
          </div>
          {!isLoading && !error && agents.length === 0 && (
            <p className="text-sm text-gray-500">No agent configurations in the database.</p>
          )}
        </div>

        {/* Where the retired controls' jobs are done now */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Where things live</h2>
          <ul className="space-y-3">
            {HOMES.map((h) => (
              <li key={h.what} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{h.what}</p>
                  <p className="text-gray-600">{h.where}</p>
                </div>
                {h.href && (h.internal ? (
                  <Link to={h.href} className="text-blkout-600 hover:underline inline-flex items-center gap-1 shrink-0">
                    <User size={14} /> Open
                  </Link>
                ) : (
                  <a href={h.href} target="_blank" rel="noopener noreferrer" className="text-blkout-600 hover:underline inline-flex items-center gap-1 shrink-0">
                    <ExternalLink size={14} /> Open
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
