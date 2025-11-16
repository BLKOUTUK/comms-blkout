
import { useState } from 'react';
import { HeroSection } from '../components/discover/HeroSection';
import { ContentCard } from '../components/discover/ContentCard';
import { ContentFilter } from '../components/discover/ContentFilter';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { usePublishedContent } from '../hooks/useContent';
import type { ContentFilters } from '../types';

export function DiscoverPage() {
  const [filters, setFilters] = useState<ContentFilters>({});
  const { content, loading, error } = usePublishedContent(50);

  // Filter content based on current filters
  const filteredContent = content.filter(item => {
    if (filters.platform?.length && !filters.platform.includes(item.platform_id)) {
      return false;
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.primary_content?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Latest Community Content
        </h2>

        <ContentFilter filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-red-600">Error loading content: {error.message}</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No content found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
