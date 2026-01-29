
import { useState } from 'react';
import { Sparkles, BookOpen, Calendar, Users, Heart, ArrowRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface CoFounderArticle {
  name: string;
  title: string;
  excerpt: string;
  publishDate: string;
  role: string;
  slug: string;
}

const CO_FOUNDER_ARTICLES: CoFounderArticle[] = [
  {
    name: 'Antoine',
    title: 'Crossing Deep Waters',
    excerpt: 'A personal reflection on the journey that led to founding BLKOUT and the waters we crossed together as a community.',
    publishDate: '3 Feb 2026',
    role: 'Co-Founder',
    slug: 'crossing-deep-waters',
  },
  {
    name: 'Marc',
    title: 'If You Build It...',
    excerpt: 'On building the infrastructure for community power and what it means to create something that belongs to everyone.',
    publishDate: '5 Feb 2026',
    role: 'Co-Founder',
    slug: 'if-you-build-it',
  },
  {
    name: 'Rob',
    title: 'Adventures in Unchartered Territory',
    excerpt: 'Navigating the unknown as we built a platform for Black queer liberation in the UK.',
    publishDate: '8 Feb 2026',
    role: 'Co-Founder',
    slug: 'adventures-in-unchartered-territory',
  },
];

const MILESTONES = [
  { year: '2016', label: 'BLKOUT founded', icon: Heart },
  { year: '2018', label: 'First community events', icon: Calendar },
  { year: '2020', label: 'Digital community launch', icon: Users },
  { year: '2022', label: 'Community Benefit Society', icon: Sparkles },
  { year: '2024', label: '32,000+ members', icon: Users },
  { year: '2026', label: '10 years of liberation', icon: Heart },
];

export function AnniversaryWidget() {
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            10 Years of BLKOUT
          </h2>
          <p className="text-sm text-gray-600">
            Celebrating a decade of Black queer liberation
          </p>
        </div>
        <span className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-200">
          2016 &ndash; 2026
        </span>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-blkout-900 to-purple-900 p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400 opacity-10 rounded-full -mr-36 -mt-36 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-blkout-400 opacity-10 rounded-full -ml-28 -mb-28 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-400 opacity-5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Anniversary badge */}
            <div className="shrink-0 w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-display font-bold leading-none">10</div>
                <div className="text-xs font-semibold uppercase tracking-wider mt-1">Years</div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center md:text-left flex-1">
              <h3 className="text-3xl md:text-4xl font-display font-bold mb-3 leading-tight">
                A Decade of Building
                <span className="text-amber-400"> Collective Power</span>
              </h3>
              <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-2xl">
                From a bold idea in 2016 to the UK's only Black queer-led Community Benefit Society.
                Ten years of transforming "a category into a community" through love, justice, and
                cooperative ownership.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href="https://blkoutuk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-gray-900 hover:bg-amber-500 font-bold rounded-lg transition-colors"
                >
                  Our Story
                  <ArrowRight size={18} />
                </a>
                <a
                  href="https://blkouthub.com/join"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 font-bold rounded-lg transition-colors"
                >
                  <Heart size={18} />
                  Join the Community
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Co-Founder Stories Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blkout-600" />
            <h3 className="text-lg font-display font-bold text-gray-900">
              Co-Founder Stories
            </h3>
            <span className="px-2.5 py-0.5 bg-blkout-100 text-blkout-700 rounded-full text-xs font-semibold">
              February Series
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            The people behind the platform share their reflections on a decade of community building.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {CO_FOUNDER_ARTICLES.map((article) => (
            <a
              key={article.slug}
              href={`https://blkoutuk.com/stories#${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-6 hover:bg-gray-50 transition-colors group"
            >
              {/* Author avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blkout-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {article.name[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{article.name}</span>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-blkout-600 font-medium">{article.role}</span>
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-blkout-600 transition-colors mb-1">
                  {article.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{article.publishDate}</span>
                </div>
              </div>

              <ExternalLink size={16} className="text-gray-300 group-hover:text-blkout-500 transition-colors shrink-0 mt-1" />
            </a>
          ))}
        </div>
      </div>

      {/* Timeline Toggle */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-blkout-600 hover:text-blkout-700 transition-colors"
      >
        {showTimeline ? 'Hide' : 'View'} Our Journey
        {showTimeline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Timeline */}
      {showTimeline && (
        <div className="bg-gradient-to-br from-gray-50 to-blkout-50/30 rounded-xl p-6 border border-gray-100">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blkout-300 via-purple-300 to-amber-400/50" />

            <div className="space-y-6">
              {MILESTONES.map((milestone, index) => {
                const Icon = milestone.icon;
                return (
                  <div key={milestone.year} className="flex items-center gap-4 relative">
                    {/* Node */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm ${
                      index === MILESTONES.length - 1
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                        : 'bg-white border-2 border-blkout-300'
                    }`}>
                      <Icon size={18} className={
                        index === MILESTONES.length - 1 ? 'text-gray-900' : 'text-blkout-600'
                      } />
                    </div>

                    {/* Content */}
                    <div className="flex items-baseline gap-3">
                      <span className={`text-sm font-bold ${
                        index === MILESTONES.length - 1 ? 'text-amber-600' : 'text-blkout-600'
                      }`}>
                        {milestone.year}
                      </span>
                      <span className={`text-sm ${
                        index === MILESTONES.length - 1 ? 'font-bold text-gray-900' : 'text-gray-700'
                      }`}>
                        {milestone.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
