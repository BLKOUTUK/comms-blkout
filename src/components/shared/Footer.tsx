
import { Heart, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About BLKOUT UK</h3>
            <p className="text-gray-400 text-sm">
              The UK's only Black queer-led Community Benefit Society, building collective power through cooperative ownership, media sovereignty, and liberation practices rooted in love and justice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/discover" className="text-gray-400 hover:text-white transition-colors">
                  Discover Content
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Our Mission
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Get Involved
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://github.com/BLKOUTUK" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p className="flex items-center justify-center">
            Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> by BLKOUT UK Community
          </p>
          <p className="mt-2">© {new Date().getFullYear()} BLKOUT UK. All rights reserved.</p>
          <p className="mt-4 text-xs text-gray-500 max-w-2xl mx-auto">
            BLKOUT Creative Ltd is registered by the Financial Conduct Authority (London) as a Community Benefit Society under the Co-operative and Community Benefit Societies Act 2014.
          </p>
        </div>
      </div>
    </footer>
  );
}
