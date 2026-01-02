import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('https://crm.blkoutuk.cloud/api/community/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subscriptions: {
            newsletter: true,
            events: false,
            blkouthub: false,
            volunteer: false,
          },
          consentGiven: true,
          source: 'comms_blkout_discover',
          sourceUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Successfully subscribed to BLKOUT updates!');
        setEmail('');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        throw new Error(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blkout-50 to-purple-50 rounded-2xl p-8 border border-blkout-200">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blkout-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
          Stay Connected
        </h3>

        <p className="text-gray-600 mb-6">
          Get the latest stories, events, and community updates delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            required
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blkout-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="px-6 py-3 bg-gradient-to-r from-blkout-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blkout-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
          >
            {status === 'submitting' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Subscribing
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle size={18} />
                Subscribed!
              </>
            ) : status === 'error' ? (
              <>
                <AlertCircle size={18} />
                Try Again
              </>
            ) : (
              <>
                <Mail size={18} />
                Subscribe
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 text-sm font-medium ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {status === 'success' ? '✅ ' : '❌ '}
            {message}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          By subscribing, you agree to receive communications from BLKOUT. We respect your privacy and you can unsubscribe at any time.
        </p>
      </div>
    </div>
  );
}
