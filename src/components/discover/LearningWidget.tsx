
import { useState } from 'react';
import { GraduationCap, Users, Send, CheckCircle } from 'lucide-react';

const SUGGESTIONS = [
  'Cooperative ownership & governance',
  'Digital sovereignty & data rights',
  'Mental health & wellbeing',
  'Creative skills & storytelling',
  'Leadership & organising',
  'Financial literacy & funding',
];

export function LearningWidget() {
  const [selected, setSelected] = useState<string[]>([]);
  const [customIdea, setCustomIdea] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggle = (item: string) =>
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );

  const handleSubmit = () => {
    // TODO: wire to Supabase comms_feedback table
    console.log('Learning preferences:', { selected, customIdea });
    setSubmitted(true);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Learning & Self-Improvement
          </h2>
          <span className="inline-block mt-1 px-3 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide">
            Coming Soon
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-2 leading-relaxed">
        We're building a learning space rooted in liberation values — courses, skill exchanges, and
        mentorship powered by{' '}
        <a
          href="https://blkouthub.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
        >
          <Users size={14} />
          BLKOUTHUB
        </a>{' '}
        community.
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Available exclusively to BLKOUT members. Help us shape it.
      </p>

      {!submitted ? (
        <>
          <p className="text-gray-900 font-semibold text-sm mb-3">
            What would you most like to learn?
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => toggle(item)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected.includes(item)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Something else? Tell us..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
            <button
              onClick={handleSubmit}
              disabled={selected.length === 0 && !customIdea.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">Thanks for sharing!</p>
          <p className="text-gray-500 text-sm mt-1">
            Your input helps us build something that truly serves our community.
          </p>
        </div>
      )}
    </div>
  );
}
