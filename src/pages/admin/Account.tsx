import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { KeyRound, CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowRight } from 'lucide-react';

// "Where things live" arrived here on 10 September 2026 when the Settings page was
// retired. Settings held six agent toggles that wrote a column nothing outside the admin
// read, and this card. The card is the part that was doing a job: it answers "I used to
// do that here — where is it now?", which is the only question the old page could answer.
const HOMES: { what: string; where: string; href?: string; internal?: boolean }[] = [
  { what: 'What is scheduled, ready and posted', where: 'the content register', href: '/admin/calendar', internal: true },
  { what: 'The books — cash, funds, income', where: 'the finance page; the ledger itself is built by build-finance.mjs', href: '/admin/finance', internal: true },
  { what: 'Adding a bank statement to the books', where: 'the Finance panel in Mission Control (localhost:8765)' },
  { what: 'Writing and sending a newsletter', where: 'the blkout-newsletter skill; sending is SendFox', href: 'https://sendfox.com' },
  { what: 'Branded images and video', where: 'the blkout-image-gen skill' },
  { what: 'Posting to social platforms', where: 'the Zapier routines — see the posting playbook' },
];

function Homes() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <h2 className="font-medium text-gray-900 mb-1">Where things live</h2>
      <p className="text-sm text-gray-600 mb-4">
        The admin pages show the record. The work itself happens in the places below.
      </p>
      <ul className="space-y-3">
        {HOMES.map((h) => (
          <li key={h.what} className="flex items-start justify-between gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">{h.what}</p>
              <p className="text-gray-600">{h.where}</p>
            </div>
            {h.href && (h.internal ? (
              <Link to={h.href} className="text-blkout-600 hover:underline inline-flex items-center gap-1 shrink-0">
                <ArrowRight size={14} /> Open
              </Link>
            ) : (
              <a href={h.href} target="_blank" rel="noopener noreferrer"
                 className="text-blkout-600 hover:underline inline-flex items-center gap-1 shrink-0">
                <ExternalLink size={14} /> Open
              </a>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Account() {
  const { user, updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not change the password. Try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Your account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Signed in as <span className="font-medium text-gray-900">{user?.email}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center gap-2 pb-1">
            <KeyRound className="w-4 h-4 text-blkout-600" aria-hidden="true" />
            <h2 className="font-medium text-gray-900">Change your password</h2>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blkout-600 focus:outline-none focus:ring-2 focus:ring-blkout-600/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blkout-600 focus:outline-none focus:ring-2 focus:ring-blkout-600/30"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {done && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>Password changed. Use it next time you sign in.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blkout-600 px-4 py-2.5 text-white font-medium shadow-sm transition hover:bg-blkout-700 focus:outline-none focus:ring-2 focus:ring-blkout-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isSaving ? 'Saving…' : 'Change password'}
          </button>
        </form>

        <Homes />
      </div>
    </Layout>
  );
}

export default Account;
