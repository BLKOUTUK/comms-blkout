
import { useState, useMemo } from 'react';
import { Users, Check, Info, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { SendFoxList } from '@/hooks/useSendFoxStatus';

// Predefined segment groups for common targeting scenarios
const SEGMENT_PRESETS = [
  {
    id: 'weekly_engaged',
    name: 'Weekly Engaged',
    description: 'Active community members who opted into weekly updates',
    listIds: [538297], // BLKOUT Hub
    recommended: true,
  },
  {
    id: 'monthly_circle',
    name: 'Community Circle',
    description: 'Broader community for monthly digests and announcements',
    listIds: [538162], // Community Circle (Monthly)
    recommended: false,
  },
  {
    id: 'coop_members',
    name: 'Coop Members',
    description: 'Founding and current cooperative members',
    listIds: [591727, 592260], // Coop Founding + Founder Members
    recommended: false,
  },
  {
    id: 'all_subscribers',
    name: 'All Subscribers',
    description: 'Everyone including legacy subscribers (use carefully)',
    listIds: [538297, 538162, 538296], // Hub + Circle + Legacy
    recommended: false,
  },
  {
    id: 'custom',
    name: 'Custom Selection',
    description: 'Choose specific lists manually',
    listIds: [],
    recommended: false,
  },
];

interface SegmentSelectorProps {
  lists: SendFoxList[];
  selectedListIds: number[];
  onSelectionChange: (listIds: number[]) => void;
  editionType?: 'weekly' | 'monthly';
  compact?: boolean;
}

export function SegmentSelector({
  lists,
  selectedListIds,
  onSelectionChange,
  editionType,
  compact = false,
}: SegmentSelectorProps) {
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    // Auto-detect preset based on edition type
    if (editionType === 'weekly') return 'weekly_engaged';
    if (editionType === 'monthly') return 'monthly_circle';
    return null;
  });
  const [showCustomLists, setShowCustomLists] = useState(false);

  // Calculate total subscribers for selected lists (avoiding duplicates)
  const audienceSize = useMemo(() => {
    const selectedLists = lists.filter(l => selectedListIds.includes(l.id));
    // Note: This is an estimate - actual unique subscribers may be lower due to overlap
    return selectedLists.reduce((sum, list) => sum + list.subscribers, 0);
  }, [lists, selectedListIds]);

  const handlePresetSelect = (preset: typeof SEGMENT_PRESETS[0]) => {
    setActivePreset(preset.id);
    if (preset.id === 'custom') {
      setShowCustomLists(true);
    } else {
      setShowCustomLists(false);
      onSelectionChange(preset.listIds);
    }
  };

  const handleListToggle = (listId: number) => {
    if (selectedListIds.includes(listId)) {
      onSelectionChange(selectedListIds.filter(id => id !== listId));
    } else {
      onSelectionChange([...selectedListIds, listId]);
    }
    setActivePreset('custom');
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Target Audience
        </label>
        <select
          value={activePreset || ''}
          onChange={(e) => {
            const preset = SEGMENT_PRESETS.find(p => p.id === e.target.value);
            if (preset) handlePresetSelect(preset);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500"
        >
          <option value="">Select audience...</option>
          {SEGMENT_PRESETS.filter(p => p.id !== 'custom').map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} {preset.recommended && '(Recommended)'}
            </option>
          ))}
        </select>
        {audienceSize > 0 && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Users size={14} />
            ~{audienceSize.toLocaleString()} subscribers
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preset Segments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Target Audience Segment
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SEGMENT_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            const presetSubscribers = lists
              .filter(l => preset.listIds.includes(l.id))
              .reduce((sum, l) => sum + l.subscribers, 0);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  isActive
                    ? 'border-blkout-500 bg-blkout-50 ring-2 ring-blkout-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.recommended && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blkout-600 text-white text-xs rounded-full flex items-center gap-1">
                    <Sparkles size={10} />
                    Recommended
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium ${isActive ? 'text-blkout-900' : 'text-gray-900'}`}>
                      {preset.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                  </div>
                  {isActive && (
                    <Check size={18} className="text-blkout-600 flex-shrink-0" />
                  )}
                </div>
                {preset.id !== 'custom' && presetSubscribers > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                    <Users size={12} />
                    {presetSubscribers.toLocaleString()} subscribers
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom List Selection */}
      {activePreset === 'custom' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCustomLists(!showCustomLists)}
            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>Select Individual Lists ({selectedListIds.length} selected)</span>
            {showCustomLists ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showCustomLists && (
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {lists.map((list) => {
                const isSelected = selectedListIds.includes(list.id);
                return (
                  <label
                    key={list.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blkout-50 border border-blkout-200' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleListToggle(list.id)}
                        className="w-4 h-4 text-blkout-600 border-gray-300 rounded focus:ring-blkout-500"
                      />
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-blkout-900' : 'text-gray-900'}`}>
                          {list.name}
                        </p>
                        <p className="text-xs text-gray-500">ID: {list.id}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {list.subscribers.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Audience Preview */}
      {selectedListIds.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blkout-50 to-purple-50 rounded-xl border border-blkout-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blkout-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blkout-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Audience</p>
                <p className="text-2xl font-bold text-blkout-600">
                  {audienceSize.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {selectedListIds.length} list{selectedListIds.length !== 1 ? 's' : ''} selected
              </p>
              {selectedListIds.length > 1 && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <Info size={12} />
                  May include overlap
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick segment badge for display purposes
export function SegmentBadge({
  listIds,
  lists
}: {
  listIds: number[];
  lists: SendFoxList[];
}) {
  const preset = SEGMENT_PRESETS.find(p =>
    p.listIds.length === listIds.length &&
    p.listIds.every(id => listIds.includes(id))
  );

  const subscribers = lists
    .filter(l => listIds.includes(l.id))
    .reduce((sum, l) => sum + l.subscribers, 0);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blkout-50 text-blkout-700 rounded-lg text-sm">
      <Users size={14} />
      <span className="font-medium">
        {preset ? preset.name : `${listIds.length} lists`}
      </span>
      <span className="text-blkout-500">
        ({subscribers.toLocaleString()})
      </span>
    </div>
  );
}
