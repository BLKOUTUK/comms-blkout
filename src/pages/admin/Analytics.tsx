
import { Layout } from '@/components/layout/Layout';
import { mockCommunityMetrics } from '@/lib/mockData';
import { Users, MessageSquare, Heart, Target } from 'lucide-react';

export function Analytics() {
  const metrics = mockCommunityMetrics;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Community-focused metrics that prioritize quality over quantity
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-blkout-600" size={32} />
              <span className="text-sm text-green-600 font-medium">↑ 5.2%</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalMembers.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.newMembers} new this {metrics.period}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="text-community-trust" size={32} />
              <span className="text-sm text-green-600 font-medium">↑ 3.1%</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Engagement Quality</p>
            <p className="text-3xl font-bold text-gray-900">{metrics.engagementQuality}%</p>
            <p className="text-xs text-gray-500 mt-2">
              Meaningful interactions over likes
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <Heart className="text-community-warmth" size={32} />
              <span className="text-sm text-green-600 font-medium">↑ 2.4%</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Trust Score</p>
            <p className="text-3xl font-bold text-gray-900">{metrics.trustScore}/100</p>
            <p className="text-xs text-gray-500 mt-2">
              Community trust indicator
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <Target className="text-community-wisdom" size={32} />
              <span className="text-sm text-green-600 font-medium">↑ 4.8%</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Content Resonance</p>
            <p className="text-3xl font-bold text-gray-900">{metrics.contentResonance}%</p>
            <p className="text-xs text-gray-500 mt-2">
              How well content connects
            </p>
          </div>
        </div>

        {/* Community Engagement Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Community Engagement Trends
          </h2>
          <div className="h-64 flex items-end justify-between gap-4">
            {/* Simple bar chart representation */}
            {[65, 72, 68, 78, 85, 82, 87].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blkout-500 rounded-t-lg hover:bg-blkout-600 transition-colors cursor-pointer"
                  style={{ height: `${value}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center mt-4">
            Engagement quality over the past week
          </p>
        </div>

        {/* Conversation Depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Conversation Depth
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Thread Length</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {metrics.conversationDepth} comments
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-community-trust rounded-full h-2"
                    style={{ width: `${(metrics.conversationDepth / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active Members Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round((metrics.activeMembers / metrics.totalMembers) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-community-wisdom rounded-full h-2"
                    style={{ width: `${(metrics.activeMembers / metrics.totalMembers) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              We measure quality of conversations, not just volume
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Relationship Building
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Repeat Engagers</p>
                  <p className="text-xs text-gray-600">Members who engage regularly</p>
                </div>
                <span className="text-2xl font-bold text-green-600">68%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Response Rate</p>
                  <p className="text-xs text-gray-600">We reply to community</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">94%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Member Retention</p>
                  <p className="text-xs text-gray-600">Members staying active</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">89%</span>
              </div>
            </div>
          </div>
        </div>

        {/* BLKOUT Philosophy */}
        <div className="card bg-blkout-50 border-blkout-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Our Analytics Philosophy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">
                Quality Over Quantity
              </h4>
              <p>
                We measure the depth and authenticity of community interactions, not just
                vanity metrics like follower counts.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">
                Community Trust
              </h4>
              <p>
                Our trust score reflects how well we build relationships and move at the
                speed of trust with our community.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">
                Relationship Building
              </h4>
              <p>
                We prioritize metrics that show we're creating lasting connections, not
                just temporary engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
