/**
 * Newsletter Preferences Page
 *
 * Public page for subscribers to:
 * - Update content preferences
 * - Set frequency
 * - Unsubscribe
 * - Get referral link
 * - Share with friends
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  Bell,
  Calendar,
  Users,
  Megaphone,
  BookOpen,
  Handshake,
  MessageSquare,
  Check,
  Share2,
  Copy,
  CheckCircle2,
  Loader2,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Preferences {
  events: boolean;
  community_news: boolean;
  board_updates: boolean;
  campaigns: boolean;
  blog_posts: boolean;
  partner_content: boolean;
  surveys: boolean;
}

interface SubscriberData {
  id: string;
  email: string;
  is_subscribed: boolean;
  preferences: Preferences;
  frequency: string;
  interests: string[];
  location: string | null;
  referral_code: string;
}

const INTEREST_OPTIONS = [
  'Health & Wellbeing',
  'Arts & Culture',
  'Nightlife & Social',
  'Professional Networking',
  'Activism & Advocacy',
  'Spirituality & Faith',
  'Sports & Fitness',
  'Dating & Relationships',
  'Mental Health',
  'Financial Wellbeing',
];

const PREFERENCE_CONFIG = [
  { key: 'events', label: 'Events & Meetups', description: 'Community events, parties, and gatherings', icon: Calendar },
  { key: 'community_news', label: 'Community News', description: 'Updates about BLKOUT and our community', icon: Users },
  { key: 'board_updates', label: 'Board & Governance', description: 'Updates from the BLKOUT Board', icon: Megaphone },
  { key: 'campaigns', label: 'Campaigns', description: 'Campaign launches and calls to action', icon: Heart },
  { key: 'blog_posts', label: 'BLKOUT Voices Blog', description: 'Stories and articles from the community', icon: BookOpen },
  { key: 'partner_content', label: 'Partner Updates', description: 'News from our partners and collaborators', icon: Handshake },
  { key: 'surveys', label: 'Surveys & Feedback', description: 'Opportunities to share your voice', icon: MessageSquare },
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Get updates every week' },
  { value: 'monthly', label: 'Monthly', description: 'Once a month newsletter' },
  { value: 'quarterly', label: 'Quarterly', description: 'Seasonal updates only' },
  { value: 'important_only', label: 'Important Only', description: 'Major announcements only' },
];

export function NewsletterPreferences() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [data, setData] = useState<SubscriberData | null>(null);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [unsubscribeReason, setUnsubscribeReason] = useState('');

  // Load preferences if email/token provided
  useEffect(() => {
    if (emailParam) {
      loadPreferences(emailParam);
    }
  }, [emailParam]);

  const loadPreferences = async (emailToLoad: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: prefs, error: fetchError } = await supabase
        .from('newsletter_preferences')
        .select('*')
        .eq('email', emailToLoad.toLowerCase())
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No record found - create new one
          const { data: newPrefs, error: insertError } = await supabase
            .from('newsletter_preferences')
            .insert({ email: emailToLoad.toLowerCase() })
            .select()
            .single();

          if (insertError) throw insertError;
          setData(newPrefs);
        } else {
          throw fetchError;
        }
      } else {
        setData(prefs);
      }
      setIsVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      loadPreferences(email.trim());
    }
  };

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    if (!data) return;
    setData({
      ...data,
      preferences: { ...data.preferences, [key]: value },
    });
  };

  const updateFrequency = (frequency: string) => {
    if (!data) return;
    setData({ ...data, frequency });
  };

  const toggleInterest = (interest: string) => {
    if (!data) return;
    const interests = data.interests.includes(interest)
      ? data.interests.filter((i) => i !== interest)
      : [...data.interests, interest];
    setData({ ...data, interests });
  };

  const savePreferences = async () => {
    if (!data) return;
    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('newsletter_preferences')
        .update({
          preferences: data.preferences,
          frequency: data.frequency,
          interests: data.interests,
          location: data.location,
        })
        .eq('id', data.id);

      if (updateError) throw updateError;
      setSuccess('Your preferences have been saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!data) return;
    setIsSaving(true);
    setError(null);

    try {
      // Update preferences
      await supabase
        .from('newsletter_preferences')
        .update({
          is_subscribed: false,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: unsubscribeReason,
        })
        .eq('id', data.id);

      // Log unsubscribe
      await supabase.from('newsletter_unsubscribe_log').insert({
        email: data.email,
        preference_id: data.id,
        reason: unsubscribeReason,
      });

      setData({ ...data, is_subscribed: false });
      setShowUnsubscribe(false);
      setSuccess('You have been unsubscribed. We\'re sorry to see you go.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubscribe = async () => {
    if (!data) return;
    setIsSaving(true);

    try {
      await supabase
        .from('newsletter_preferences')
        .update({ is_subscribed: true, unsubscribed_at: null })
        .eq('id', data.id);

      setData({ ...data, is_subscribed: true });
      setSuccess('Welcome back! You\'ve been resubscribed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resubscribe');
    } finally {
      setIsSaving(false);
    }
  };

  const copyReferralLink = () => {
    if (!data?.referral_code) return;
    const link = `${window.location.origin}/subscribe?ref=${data.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Email lookup form
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blkout-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Newsletter Preferences</h1>
            <p className="text-gray-600 mt-2">Enter your email to manage your subscription</p>
          </div>

          <form onSubmit={handleLookup} className="card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Manage Preferences'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Preferences form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blkout-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your Preferences</h1>
          <p className="text-gray-600 mt-2">{data?.email}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Unsubscribed State */}
        {data && !data.is_subscribed && (
          <div className="card mb-6 border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">You're currently unsubscribed</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You won't receive our newsletters. Want to come back?
                </p>
              </div>
              <button
                onClick={handleResubscribe}
                disabled={isSaving}
                className="btn btn-primary"
              >
                Resubscribe
              </button>
            </div>
          </div>
        )}

        {/* Content Preferences */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">Choose what you'd like to hear about:</p>

          <div className="space-y-3">
            {PREFERENCE_CONFIG.map(({ key, label, description, icon: Icon }) => (
              <label
                key={key}
                className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                  data?.preferences[key as keyof Preferences]
                    ? 'border-blkout-300 bg-blkout-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  data?.preferences[key as keyof Preferences]
                    ? 'bg-blkout-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={data?.preferences[key as keyof Preferences] || false}
                  onChange={(e) => updatePreference(key as keyof Preferences, e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blkout-600 focus:ring-blkout-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Frequency</h2>
          <div className="grid grid-cols-2 gap-3">
            {FREQUENCY_OPTIONS.map(({ value, label, description }) => (
              <label
                key={value}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  data?.frequency === value
                    ? 'border-blkout-600 bg-blkout-50 ring-2 ring-blkout-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={value}
                  checked={data?.frequency === value}
                  onChange={() => updateFrequency(value)}
                  className="sr-only"
                />
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Interests</h2>
          <p className="text-sm text-gray-600 mb-4">
            Help us send you more relevant content:
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  data?.interests.includes(interest)
                    ? 'bg-blkout-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Share with a Friend */}
        <div className="card mb-6 bg-gradient-to-r from-blkout-50 to-purple-50 border-blkout-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blkout-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Share BLKOUT with a Friend</h3>
              <p className="text-sm text-gray-600 mt-1">
                Know someone who'd love our community? Share your personal invite link.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 px-3 py-2 bg-white rounded-lg text-sm text-gray-700 border">
                  {window.location.origin}/subscribe?ref={data?.referral_code}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowUnsubscribe(true)}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Unsubscribe from all emails
          </button>

          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </button>
        </div>

        {/* Unsubscribe Modal */}
        {showUnsubscribe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                We're sorry to see you go
              </h3>
              <p className="text-gray-600 mb-4">
                You'll stop receiving all emails from BLKOUT. Can you tell us why?
              </p>

              <div className="space-y-2 mb-4">
                {[
                  'Too many emails',
                  'Content not relevant',
                  'Just taking a break',
                  'Other reason',
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="unsubscribe_reason"
                      value={reason}
                      checked={unsubscribeReason === reason}
                      onChange={(e) => setUnsubscribeReason(e.target.value)}
                      className="text-blkout-600"
                    />
                    <span className="text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnsubscribe(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnsubscribe}
                  disabled={isSaving}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  Unsubscribe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
