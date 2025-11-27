
import { ArrowRight, CheckCircle, Heart, Sparkles } from 'lucide-react';

export function BlkoutHubWidget() {
  const features = [
    'Member-only community forums',
    'Cooperative decision-making',
    'Resource library & toolkits',
    'Event calendar & meetups'
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blkout-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/images/blkouthub_logo.png"
              alt="BLKOUT HUB"
              className="w-24 h-24 object-contain rounded-xl bg-white/10 backdrop-blur-sm p-2"
            />
            <div>
              <h2 className="text-2xl font-display font-bold mb-1">
                BLKOUT HUB
              </h2>
              <p className="text-white/90 text-sm">
                Our Digital Community Home
              </p>
            </div>
          </div>
          <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
        </div>

        {/* Description */}
        <p className="text-white/95 text-lg mb-6 leading-relaxed">
          Join our vibrant online community platform where members connect, organize, and build collective power together.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-white/90"
            >
              <CheckCircle size={18} className="text-green-300 shrink-0" />
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://blkouthub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white text-blkout-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            Visit BLKOUT HUB
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="https://blkouthub.com/join"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-white/30"
          >
            <Heart size={18} />
            Become a Member
          </a>
        </div>

        {/* Footer note */}
        <p className="text-white/70 text-xs text-center mt-6">
          Building community at the speed of trust 🖤
        </p>
      </div>
    </div>
  );
}
