
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ContentCard } from '@/components/shared/ContentCard';
import { usePublishedContent } from '@/hooks/useContent';
import { Filter, Search } from 'lucide-react';
import type { PlatformType } from '@/types';

export function DiscoverPage() {
  const { content, isLoading } = usePublishedContent();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = content.filter((item) => {
    const matchesPlatform =
      selectedPlatform === 'all' || item.platforms.includes(selectedPlatform);
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <Layout showSidebar={false}>
      {/* Hero Section */}
      <div className="mb-12 text-center animate-fade-in">
        <h1 className="text-5xl font-display font-bold text-gray-900 mb-4">
          Community Stories & Action
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto text-balance">
          Authentic voices, collective power. Explore our latest content rooted in{' '}
          <span className="text-blkout-600 font-semibold">Black feminist thought</span> and
          community organizing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
          <span className="px-4 py-2 bg-community-warmth/10 text-community-warmth rounded-lg font-medium">
            Move at the speed of trust
          </span>
          <span className="px-4 py-2 bg-community-trust/10 text-community-trust rounded-lg font-medium">
            Trust the people
          </span>
          <span className="px-4 py-2 bg-community-wisdom/10 text-community-wisdom rounded-lg font-medium">
            Build relationships
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as PlatformType | 'all')}
            className="input min-w-[150px]"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-600"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No content found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchQuery || selectedPlatform !== 'all'
              ? 'Try adjusting your filters'
              : 'Check back soon for new content'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredContent.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      )}

      {/* Social Media Embed Section */}
      <div className="mt-16 pt-16 border-t border-gray-200">
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-8 text-center">
          Follow Our Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Instagram</h3>
                <p className="text-sm text-gray-500">@blkout_uk</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Visual stories from our community and organizing work
            </p>
            <a
              href="https://instagram.com/blkout_uk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
            >
              View on Instagram
            </a>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg"></div>
              <div>
                <h3 className="font-semibold text-gray-900">LinkedIn</h3>
                <p className="text-sm text-gray-500">BLKOUT UK</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Professional insights and campaign updates
            </p>
            <a
              href="https://linkedin.com/company/blkout-uk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
            >
              View on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
