
import { Filter } from 'lucide-react';
import { usePlatforms } from '../../hooks/usePlatforms';
import type { ContentFilters } from '../../types';

interface ContentFilterProps {
  filters: ContentFilters;
  onFilterChange: (filters: ContentFilters) => void;
}

export function ContentFilter({ filters, onFilterChange }: ContentFilterProps) {
  const { platforms } = usePlatforms();

  const handlePlatformToggle = (platformId: string) => {
    const currentPlatforms = filters.platform || [];
    const newPlatforms = currentPlatforms.includes(platformId)
      ? currentPlatforms.filter(id => id !== platformId)
      : [...currentPlatforms, platformId];
    
    onFilterChange({ ...filters, platform: newPlatforms });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filter Content
        </h3>
        <button
          onClick={handleReset}
          className="text-sm text-blkout-purple hover:text-purple-700"
        >
          Reset
        </button>
      </div>

      {/* Platform filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Platform
        </label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handlePlatformToggle(platform.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.platform?.includes(platform.id)
                  ? 'bg-blkout-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {platform.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          placeholder="Search content..."
          value={filters.searchQuery || ''}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-purple focus:border-transparent"
        />
      </div>
    </div>
  );
}
