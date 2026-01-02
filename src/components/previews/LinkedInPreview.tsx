import type { Draft } from '@/types';

interface LinkedInPreviewProps {
  draft: Draft;
  onClose: () => void;
}

export function LinkedInPreview({ draft, onClose }: LinkedInPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="max-w-lg w-full bg-white rounded border shadow-lg" onClick={(e) => e.stopPropagation()}>
        {/* LinkedIn header */}
        <div className="p-4 flex items-center border-b">
          <div className="w-12 h-12 bg-blue-700 rounded text-white flex items-center justify-center font-bold text-lg">
            BK
          </div>
          <div className="ml-3 flex-1">
            <p className="font-semibold text-sm">BLKOUT UK</p>
            <p className="text-xs text-gray-500">Community Benefit Society</p>
            <p className="text-xs text-gray-500">Just now · 🌍</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">{draft.body}</p>
        </div>

        {/* Image placeholder */}
        <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-y">
          <span className="text-gray-400 text-sm">Image Preview</span>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t text-gray-600 text-xs flex gap-6">
          <button className="hover:bg-gray-100 px-3 py-2 rounded flex items-center gap-1">
            👍 <span>Like</span>
          </button>
          <button className="hover:bg-gray-100 px-3 py-2 rounded flex items-center gap-1">
            💬 <span>Comment</span>
          </button>
          <button className="hover:bg-gray-100 px-3 py-2 rounded flex items-center gap-1">
            ↗️ <span>Repost</span>
          </button>
          <button className="hover:bg-gray-100 px-3 py-2 rounded flex items-center gap-1">
            📤 <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
