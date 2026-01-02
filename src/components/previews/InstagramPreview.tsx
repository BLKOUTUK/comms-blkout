import type { Draft } from '@/types';

interface InstagramPreviewProps {
  draft: Draft;
  onClose: () => void;
}

export function InstagramPreview({ draft, onClose }: InstagramPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Instagram header */}
        <div className="p-3 flex items-center border-b">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">BK</span>
            </div>
          </div>
          <span className="ml-2 font-semibold text-sm">blkout_uk</span>
          <button onClick={onClose} className="ml-auto text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image placeholder if no image */}
        <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Image Preview</span>
        </div>

        {/* Caption */}
        <div className="p-3">
          <p className="text-sm">
            <span className="font-semibold">blkout_uk</span>{' '}
            {draft.body}
          </p>

          <p className="text-xs text-gray-500 mt-2">2 minutes ago</p>
        </div>

        {/* Actions */}
        <div className="p-3 border-t flex justify-between text-gray-600 text-sm">
          <span>❤️ Like</span>
          <span>💬 Comment</span>
          <span>📤 Share</span>
        </div>
      </div>
    </div>
  );
}
