
import { Megaphone, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: 'event' | 'update' | 'campaign' | 'urgent';
  link?: string;
}

// Mock announcements - in production, these would come from Supabase
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'New Community Hub Features',
    excerpt: 'BLKOUT HUB now includes member forums, resource library, and cooperative decision-making tools.',
    date: '2024-03-15',
    category: 'update',
    link: 'https://blkouthub.com'
  },
  {
    id: '2',
    title: 'Black Queer Liberation Summit 2024',
    excerpt: 'Join us for our annual gathering bringing together activists, artists, and organizers across the UK.',
    date: '2024-04-20',
    category: 'event',
  },
  {
    id: '3',
    title: 'Media Sovereignty Workshop Series',
    excerpt: 'Learn to create liberatory content and build community power through storytelling.',
    date: '2024-03-22',
    category: 'campaign',
  },
];

const categoryStyles = {
  event: 'bg-community-trust/10 text-community-trust',
  update: 'bg-community-wisdom/10 text-community-wisdom',
  campaign: 'bg-community-warmth/10 text-community-warmth',
  urgent: 'bg-red-100 text-red-700'
};

const categoryLabels = {
  event: 'Event',
  update: 'Update',
  campaign: 'Campaign',
  urgent: 'Urgent'
};

export function AnnouncementsSection() {
  const [announcements] = useState<Announcement[]>(mockAnnouncements);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-community-warmth to-yellow-500 rounded-xl flex items-center justify-center">
          <Megaphone className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Community Announcements
          </h2>
          <p className="text-sm text-gray-600">
            Stay connected with our latest news and events
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <div
            key={announcement.id}
            className="card hover:shadow-lg transition-all duration-300 group cursor-pointer animate-fade-in border border-gray-100"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryStyles[announcement.category]}`}>
                    {categoryLabels[announcement.category]}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={14} />
                    {new Date(announcement.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blkout-600 transition-colors">
                  {announcement.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {announcement.excerpt}
                </p>
              </div>
              <ChevronRight 
                className="text-gray-400 group-hover:text-blkout-600 group-hover:translate-x-1 transition-all shrink-0" 
                size={20} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center pt-4">
        <button className="text-blkout-600 hover:text-blkout-700 font-semibold text-sm flex items-center gap-2 mx-auto group">
          View all announcements
          <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
}
