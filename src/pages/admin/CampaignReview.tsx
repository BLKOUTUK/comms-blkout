import { Layout } from '@/components/layout/Layout';
import { useState } from 'react';
import {
  Calendar,
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Video,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Eye,
  Edit,
  Send
} from 'lucide-react';
import campaignData from '../../../campaign-content-holiday-2025.json';
import { Holiday2025Newsletter } from '@/components/newsletters/Holiday2025Newsletter';

type Platform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok' | 'email';
type TabView = 'overview' | 'content' | 'schedule' | 'preview';

interface PlatformPost {
  platform: Platform;
  type: string;
  timing: string;
  status: 'ready' | 'scheduled' | 'draft';
  content: string;
  image?: string;
}

export function CampaignReview() {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [showNewsletterPreview, setShowNewsletterPreview] = useState(false);

  const campaign = campaignData.campaign;

  // Platform icons mapping
  const platformIcons: Record<Platform, any> = {
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    tiktok: Video,
    email: Mail,
  };

  // Platform colors
  const platformColors: Record<Platform, string> = {
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    twitter: 'bg-blue-400',
    linkedin: 'bg-blue-700',
    facebook: 'bg-blue-600',
    tiktok: 'bg-black',
    email: 'bg-green-600',
  };

  // Sample posts data (would come from campaign JSON)
  const samplePosts: PlatformPost[] = [
    {
      platform: 'email',
      type: 'Newsletter',
      timing: 'Dec 24, 10:00 AM GMT',
      status: 'ready',
      content: 'Holiday 2025 Newsletter - Merry Christmas from BLKOUT'
    },
    {
      platform: 'instagram',
      type: 'Carousel (6 slides)',
      timing: 'Dec 24, 11:00 AM GMT',
      status: 'ready',
      content: 'Main Campaign Announcement'
    },
    {
      platform: 'twitter',
      type: 'Thread (12 tweets)',
      timing: 'Dec 24, 9:00 AM GMT',
      status: 'ready',
      content: 'Year in Review Thread'
    },
    {
      platform: 'linkedin',
      type: 'Professional Post',
      timing: 'Dec 26, 8:00 AM GMT',
      status: 'ready',
      content: '2025 BLKOUT Year in Review'
    },
    {
      platform: 'facebook',
      type: 'Community Message',
      timing: 'Dec 25, 11:00 AM GMT',
      status: 'ready',
      content: 'Christmas Community Message'
    },
    {
      platform: 'tiktok',
      type: 'Video (60s)',
      timing: 'Dec 24, 5:00 PM GMT',
      status: 'ready',
      content: 'What We Built in 2025'
    },
  ];

  // Schedule data
  const scheduleByDay = [
    {
      date: 'December 24 (Christmas Eve)',
      label: 'LAUNCH DAY',
      posts: [
        { time: '9:00 AM', platform: 'twitter', content: 'Thread launch (12 tweets)' },
        { time: '10:00 AM', platform: 'email', content: 'Newsletter send' },
        { time: '11:00 AM', platform: 'instagram', content: 'Carousel post' },
        { time: '2:00 PM', platform: 'instagram', content: 'Stories (3-part)' },
        { time: '5:00 PM', platform: 'tiktok', content: 'Video post' },
        { time: '6:00 PM', platform: 'instagram', content: 'Reel' },
      ]
    },
    {
      date: 'December 25 (Christmas Day)',
      label: 'LIGHT ENGAGEMENT',
      posts: [
        { time: '8:00 AM', platform: 'twitter', content: 'Morning greeting' },
        { time: '9:00 AM', platform: 'instagram', content: 'Morning post + Stories' },
        { time: '10:00 AM', platform: 'linkedin', content: 'Professional greeting' },
        { time: '11:00 AM', platform: 'facebook', content: 'Community message' },
        { time: '2:00 PM', platform: 'twitter', content: 'Afternoon message' },
        { time: '6:00 PM', platform: 'instagram', content: 'Evening post + Stories' },
      ]
    },
    {
      date: 'December 26 (Boxing Day)',
      label: 'CONTINUED',
      posts: [
        { time: '8:00 AM', platform: 'linkedin', content: 'Professional post' },
      ]
    },
    {
      date: 'December 27',
      label: 'PREP',
      posts: [
        { time: '10:00 AM', platform: 'email', content: 'Quiz prep email (subscribers)' },
      ]
    },
    {
      date: 'December 28 (Joseph Beam Day)',
      label: 'EVENT',
      posts: [
        { time: '6:00 PM', platform: 'email', content: 'QUIZ EVENT (Zoom)' },
      ]
    },
  ];

  const filteredPosts = selectedPlatform === 'all'
    ? samplePosts
    : samplePosts.filter(p => p.platform === selectedPlatform);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              {campaign.name}
            </h1>
            <p className="text-gray-600 mt-1">{campaign.tagline}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                Launch: {campaign.launch_date}
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle2 size={16} />
                Ready to Deploy
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary inline-flex items-center gap-2">
              <Download size={18} />
              Export All
            </button>
            <button className="btn-primary inline-flex items-center gap-2">
              <Send size={18} />
              Deploy Campaign
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {(['overview', 'content', 'schedule', 'preview'] as TabView[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blkout-600 text-blkout-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Campaign Mission */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Campaign Mission</h2>
              <p className="text-gray-700">{campaign.mission}</p>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="text-3xl font-bold text-blkout-600">6</div>
                <div className="text-sm text-gray-600 mt-1">Platforms</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-blkout-600">17+</div>
                <div className="text-sm text-gray-600 mt-1">Total Posts</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-blkout-600">5</div>
                <div className="text-sm text-gray-600 mt-1">Days Duration</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600 mt-1">Ready</div>
              </div>
            </div>

            {/* Platform Coverage */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Coverage</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(platformIcons).map(([platform, Icon]) => (
                  <div key={platform} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                    <div className={`w-10 h-10 rounded-lg ${platformColors[platform as Platform]} flex items-center justify-center text-white`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 capitalize">{platform}</div>
                      <div className="text-xs text-gray-500">
                        {samplePosts.filter(p => p.platform === platform).length} posts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Files */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Files</h2>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      📄
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">campaign-content-holiday-2025.json</div>
                      <div className="text-xs text-gray-500">Campaign strategy & content structure</div>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      📝
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">HOLIDAY_2025_SOCIAL_MEDIA_COPY.md</div>
                      <div className="text-xs text-gray-500">All platform copy & captions</div>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                      🚀
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">HOLIDAY_2025_DEPLOYMENT_GUIDE.md</div>
                      <div className="text-xs text-gray-500">Complete deployment instructions</div>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      🎄
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">CHRISTMAS_DAY_POSTS.md</div>
                      <div className="text-xs text-gray-500">Special Christmas Day content</div>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Platform Filter */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                  selectedPlatform === 'all'
                    ? 'bg-blkout-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Platforms
              </button>
              {Object.entries(platformIcons).map(([platform, Icon]) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform as Platform)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                    selectedPlatform === platform
                      ? 'bg-blkout-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post, index) => {
                const Icon = platformIcons[post.platform];
                return (
                  <div key={index} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${platformColors[post.platform]} flex items-center justify-center text-white flex-shrink-0`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{post.content}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.status === 'ready' ? 'bg-green-100 text-green-700' :
                              post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{post.type}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={14} />
                            {post.timing}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-blkout-600 hover:bg-blkout-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blkout-600 hover:bg-blkout-50 rounded-lg transition-colors">
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5-Day Campaign Timeline</h2>
              <div className="space-y-6">
                {scheduleByDay.map((day, dayIndex) => (
                  <div key={dayIndex}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{day.date}</h3>
                        <p className="text-sm text-blkout-600 font-medium">{day.label}</p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
                      {day.posts.map((post, postIndex) => {
                        const Icon = platformIcons[post.platform as Platform];
                        return (
                          <div key={postIndex} className="flex items-center gap-3 py-2">
                            <div className={`w-8 h-8 rounded ${platformColors[post.platform as Platform]} flex items-center justify-center text-white flex-shrink-0`}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{post.content}</div>
                              <div className="text-xs text-gray-500">{post.time}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Newsletter Preview</h2>
                <button
                  onClick={() => setShowNewsletterPreview(!showNewsletterPreview)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Eye size={18} />
                  {showNewsletterPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {showNewsletterPreview && (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <Holiday2025Newsletter />
                  </div>
                </div>
              )}

              {!showNewsletterPreview && (
                <div className="text-center py-12 text-gray-500">
                  Click "Show Preview" to view the newsletter
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media Post Previews</h2>
              <p className="text-gray-600 mb-4">
                Full social media copy available in: <code className="bg-gray-100 px-2 py-1 rounded text-sm">docs/HOLIDAY_2025_SOCIAL_MEDIA_COPY.md</code>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Instagram size={20} className="text-pink-600" />
                    <span className="font-semibold">Instagram Carousel (Slide 1)</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded text-sm">
                    <p className="font-medium mb-2">Merry Christmas from BLKOUT 🎄✨</p>
                    <p className="text-gray-600">2025: The Year We Built Liberation Technology</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Twitter size={20} className="text-blue-400" />
                    <span className="font-semibold">Twitter Thread (Tweet 1/12)</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded text-sm">
                    <p>🧵 Merry Christmas from BLKOUT, dear boy!</p>
                    <p className="text-gray-600 mt-2">As 2025 winds down, let me tell you about the revolution we built together...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
