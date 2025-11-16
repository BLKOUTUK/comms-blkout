
import { TrendingUp, Users, Heart, MessageCircle } from 'lucide-react';

export function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics</h1>
      <p className="text-gray-600 mb-8">
        Community-focused metrics prioritizing meaningful interactions over vanity metrics.
      </p>
      
      {/* Community Impact Metrics */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Impact</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Conversations Started</span>
            <MessageCircle className="h-5 w-5 text-blkout-purple" />
          </div>
          <div className="text-2xl font-bold text-gray-900">342</div>
          <div className="text-xs text-green-600 mt-1">+23% from last month</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Community Actions</span>
            <Users className="h-5 w-5 text-blkout-purple" />
          </div>
          <div className="text-2xl font-bold text-gray-900">156</div>
          <div className="text-xs text-green-600 mt-1">+18% from last month</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Meaningful Interactions</span>
            <Heart className="h-5 w-5 text-blkout-purple" />
          </div>
          <div className="text-2xl font-bold text-gray-900">1,234</div>
          <div className="text-xs text-green-600 mt-1">+15% from last month</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Resources Accessed</span>
            <TrendingUp className="h-5 w-5 text-blkout-purple" />
          </div>
          <div className="text-2xl font-bold text-gray-900">789</div>
          <div className="text-xs text-green-600 mt-1">+31% from last month</div>
        </div>
      </div>

      {/* Platform Performance */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Performance</h2>
      <div className="card mb-8">
        <div className="space-y-4">
          {[
            { name: 'Instagram', engagement: 8.5, reach: 12500, color: '#E4405F' },
            { name: 'Twitter', engagement: 6.2, reach: 8900, color: '#1DA1F2' },
            { name: 'LinkedIn', engagement: 5.8, reach: 4200, color: '#0077B5' },
            { name: 'TikTok', engagement: 9.1, reach: 15600, color: '#000000' },
          ].map((platform) => (
            <div key={platform.name} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="font-medium text-gray-900">{platform.name}</span>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="text-gray-600">Engagement:</span>
                  <span className="font-semibold text-gray-900 ml-2">{platform.engagement}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Reach:</span>
                  <span className="font-semibold text-gray-900 ml-2">{platform.reach.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Performance</h2>
      <div className="card">
        <div className="space-y-4">
          {[
            { name: 'Griot', content: 45, avgEngagement: 7.8 },
            { name: 'Listener', content: 32, avgEngagement: 6.5 },
            { name: 'Weaver', content: 38, avgEngagement: 8.2 },
            { name: 'Strategist', content: 28, avgEngagement: 7.1 },
          ].map((agent) => (
            <div key={agent.name} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <span className="font-medium text-gray-900">{agent.name}</span>
              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="text-gray-600">Content:</span>
                  <span className="font-semibold text-gray-900 ml-2">{agent.content}</span>
                </div>
                <div>
                  <span className="text-gray-600">Avg Engagement:</span>
                  <span className="font-semibold text-gray-900 ml-2">{agent.avgEngagement}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
