
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { YouTubeEmbed } from '@/components/discover/YouTubeEmbed';
import { SocialMediaFeed } from '@/components/discover/SocialMediaFeed';
import { BlkoutHubWidget } from '@/components/discover/BlkoutHubWidget';
import { NewsletterArchive } from '@/components/discover/NewsletterArchive';
import { AdventCalendarWidget } from '@/components/discover/AdventCalendarWidget';
import { ArchiveArticleWidget } from '@/components/discover/ArchiveArticleWidget';
import { BlkoutVoicesWidget } from '@/components/discover/BlkoutVoicesWidget';
import { Heart, Users, Sparkles, ExternalLink } from 'lucide-react';

export function DiscoverPage() {
  return (
    <Layout showSidebar={false}>
      {/* Enhanced Hero Section */}
      <div className="relative mb-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blkout-600 via-purple-600 to-pink-600 opacity-5" />
        
        <div className="relative text-center animate-fade-in py-12">
          <div className="flex justify-center mb-6">
            <img
              src="/images/blkout_logo_roundel_colour.png"
              alt="BLKOUT"
              className="w-36 h-36 object-contain drop-shadow-lg"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-4">
            Discover BLKOUT
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-4">
            Your home for <span className="text-blkout-600 font-semibold">Black queer liberation</span> technology
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto text-balance mb-8">
            Built by and for our communities with sovereignty, safety, and collective power at the core.
          </p>
          
          {/* Values badges */}
          <div className="flex flex-wrap gap-3 justify-center text-sm mb-8">
            <span className="px-5 py-2.5 bg-gradient-to-r from-community-warmth/10 to-community-warmth/5 text-community-warmth rounded-full font-semibold border border-community-warmth/20 flex items-center gap-2">
              <Heart size={16} />
              Creator Sovereignty
            </span>
            <span className="px-5 py-2.5 bg-gradient-to-r from-community-trust/10 to-community-trust/5 text-community-trust rounded-full font-semibold border border-community-trust/20 flex items-center gap-2">
              <Users size={16} />
              Community Power
            </span>
            <span className="px-5 py-2.5 bg-gradient-to-r from-community-wisdom/10 to-community-wisdom/5 text-community-wisdom rounded-full font-semibold border border-community-wisdom/20 flex items-center gap-2">
              <Sparkles size={16} />
              Democratic Governance
            </span>
          </div>
        </div>
      </div>

      {/* Advent Calendar - Seasonal Feature */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <AdventCalendarWidget />
      </div>

      {/* BLKOUT HUB Widget - Prominent placement */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <BlkoutHubWidget />
      </div>

      {/* Social Media Feed - Full width carousel */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <SocialMediaFeed />
      </div>

      {/* Newsletter Archive */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <NewsletterArchive />
      </div>

      {/* BLKOUT Voices Blog */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <BlkoutVoicesWidget />
      </div>

      {/* Archive Article */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <ArchiveArticleWidget />
      </div>

      {/* YouTube Section */}
      <div className="mb-16 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <YouTubeEmbed />
      </div>

      {/* Social Media Follow Section */}
      <div className="mt-16 pt-16 border-t border-gray-200">
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-8 text-center">
          Follow Our Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
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

          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
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

      {/* Prominent link back to Community Platform */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blkout-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-display font-bold mb-3">
            Explore the Full BLKOUT Platform
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Access our complete suite of community tools, events calendar, IVOR AI assistant, and more.
          </p>
          <a
            href="https://blkout.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blkout-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Visit Community Platform
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      {/* Footer with discreet admin link */}
      <footer className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
        <p className="mb-2">
          BLKOUT UK - Technology for Black Queer Liberation
        </p>
        <div className="flex justify-center gap-4 mb-4">
          <a
            href="mailto:info@blkoutuk.com"
            className="hover:text-gray-600 transition-colors"
          >
            Contact
          </a>
          <span className="text-gray-300">|</span>
          <Link
            to="/admin"
            className="hover:text-gray-600 transition-colors"
          >
            Team Access
          </Link>
        </div>
        <p className="text-xs text-gray-500 max-w-2xl mx-auto">
          BLKOUT Creative Ltd is registered by the Financial Conduct Authority (London) as a Community Benefit Society under the Co-operative and Community Benefit Societies Act 2014.
        </p>
      </footer>
    </Layout>
  );
}
