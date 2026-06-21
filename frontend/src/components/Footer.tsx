import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-studio-dark border-t border-studio-border text-gray-400">
      {/* YouTube CTA Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-8 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        {/* Background visual decorations */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mt-6 -ml-6 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-black/10 rounded-full blur-3xl -mb-10 -mr-10"></div>
        
        <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left md:max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Subscribe to Our YouTube Channel!</h3>
            <p className="text-red-100 text-sm mt-1">
              Watch new song releases, behind-the-scenes recording clips, and exclusive Odia sound mixing tutorials.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@MusicCityOdia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-white text-red-600 font-bold px-6 py-3 rounded-lg hover:bg-red-50 transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <YoutubeIcon className="w-5 h-5 text-red-600" />
            <span>SUBSCRIBE ON YOUTUBE</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Studio Profile */}
          <div className="md:col-span-2 space-y-4">
            <span className="font-bold text-2xl tracking-tight text-white block">
              Music City <span className="text-studio-accent">Odia</span>
            </span>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio. We specialize in vocal dubbing, professional song mixing, mastering, 4K camera coverage, and high-fidelity film editing.
            </p>
            <div className="flex space-x-3 mt-4">
              <a
                href="https://www.youtube.com/@MusicCityOdia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-studio-card border border-studio-border rounded-lg flex items-center justify-center hover:border-red-500/50 hover:text-red-500 transition-colors"
                title="YouTube Channel"
              >
                <YoutubeIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/songs" className="hover:text-white transition-colors">Browse Songs</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Studio</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Direct Contacts */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact Info</h4>
            <div className="flex items-start space-x-3 text-sm">
              <Phone className="w-5 h-5 text-studio-accent shrink-0 mt-0.5" />
              <a href="tel:9937987978" className="hover:text-white transition-colors">
                +91 9937987978
              </a>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <Mail className="w-5 h-5 text-studio-accent shrink-0 mt-0.5" />
              <a href="mailto:musiccityodia@gmail.com" className="hover:text-white transition-colors break-all">
                musiccityodia@gmail.com
              </a>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <MapPin className="w-5 h-5 text-studio-accent shrink-0 mt-0.5" />
              <span>Odisha, India</span>
            </div>
          </div>
        </div>

        <div className="border-t border-studio-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Music City Odia. All Rights Reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Made with <Heart className="w-3.5 h-3.5 text-studio-accent fill-studio-accent mx-1" /> for Odia Music Lovers
          </p>
        </div>
      </div>
    </footer>
  );
};
