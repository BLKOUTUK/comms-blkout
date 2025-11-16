
import { Sparkles, Heart, Users } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative bg-gradient-to-r from-blkout-purple to-blkout-pink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to BLKOUT UK
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Transforming "a category into a community" for Black queer men across the UK
          </p>
          <p className="text-lg mb-12 max-w-2xl mx-auto opacity-90">
            The UK's only Black queer-led Community Benefit Society, building collective power through cooperative ownership, media sovereignty, and liberation practices rooted in love and justice.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">32K+</div>
              <div className="text-sm opacity-90">Community Members</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
              <Heart className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">Liberation</div>
              <div className="text-sm opacity-90">Through Love & Justice</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
              <Sparkles className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">Community</div>
              <div className="text-sm opacity-90">Ownership & Power</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)"/>
        </svg>
      </div>
    </div>
  );
}
