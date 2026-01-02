import type { Draft } from '@/types';

interface FacebookPreviewProps {
  draft: Draft;
  onClose: () => void;
}

export function FacebookPreview({ draft, onClose }: FacebookPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="max-w-lg w-full bg-white rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
        {/* Facebook header */}
        <div className="p-4 border-b flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            BK
          </div>
          <div className="ml-3 flex-1">
            <p className="font-semibold text-sm">BLKOUT UK</p>
            <p className="text-xs text-gray-500">Just now · 🌍</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm whitespace-pre-wrap">{draft.body}</p>
        </div>

        {/* Image placeholder */}
        <div className="w-full aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Image Preview</span>
        </div>

        {/* Actions */}
        <div className="p-3 border-t text-gray-600 text-sm flex justify-around">
          <button className="hover:bg-gray-100 px-4 py-2 rounded">👍 Like</button>
          <button className="hover:bg-gray-100 px-4 py-2 rounded">💬 Comment</button>
          <button className="hover:bg-gray-100 px-4 py-2 rounded">↗️ Share</button>
        </div>
      </div>
    </div>
  );
}
