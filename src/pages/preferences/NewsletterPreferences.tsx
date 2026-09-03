import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

// /preferences, /unsubscribe and /subscribe.
//
// Until 3 Sep 2026 this page read and wrote `newsletter_preferences` from the
// browser under an anon RLS policy. Nothing at send time ever read that table
// (newsletters go out from SendFox), so an "unsubscribe" here changed a row and
// nothing else; and SendFox does not substitute {{email}}, so the footer link
// never carried the address anyway. The unsubscribe that works is SendFox's own
// {{unsubscribe_url}} in every email footer; signup lives at blkoutuk.com/subscribe.
// This page now points people to those and touches no data.

const SUBSCRIBE_URL = 'https://blkoutuk.com/subscribe';

export function NewsletterPreferences() {
  const { pathname } = useLocation();
  const isSubscribe = pathname === '/subscribe';

  useEffect(() => {
    if (isSubscribe) window.location.replace(SUBSCRIBE_URL);
  }, [isSubscribe]);

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src="/images/blkoutlogo_wht_transparent.png" alt="BLKOUT" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">
            {isSubscribe ? 'Join the BLKOUT list' : 'Your emails from BLKOUT'}
          </h1>
        </div>

        <div className="bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm space-y-6">
          {isSubscribe ? (
            <p className="text-gray-700">
              Taking you to the signup form. If nothing happens,{' '}
              <a href={SUBSCRIBE_URL} className="text-blkout-600 underline">continue to blkoutuk.com/subscribe</a>.
            </p>
          ) : (
            <>
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-blkout-600 shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">To unsubscribe</h2>
                  <p className="text-gray-700 mt-1">
                    Use the unsubscribe link at the bottom of any email we've sent you. It takes
                    effect straight away — that link is the one that works.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <ArrowRight className="w-6 h-6 text-blkout-600 shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">To change what you hear about</h2>
                  <p className="text-gray-700 mt-1">
                    Reply to any newsletter and tell us. A person reads every reply.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                Not on the list yet?{' '}
                <a href={SUBSCRIBE_URL} className="text-blkout-600 underline">Join at blkoutuk.com/subscribe</a>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsletterPreferences;
