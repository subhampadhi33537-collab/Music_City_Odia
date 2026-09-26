import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Disc3, ArrowRight } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import logoImg from '../assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(4,4,12,1) 0%, rgba(2,2,8,1) 100%)' }}>
      
      {/* 3D Depth grid floor behind footer */}
      <div className="absolute inset-0 audio-grid-perspective opacity-10 pointer-events-none" />
      
      {/* Top glow rim */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-studio-accent/40 to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-studio-accent/6 to-transparent pointer-events-none" />

      {/* ── YouTube CTA Banner ── */}
      <div className="relative overflow-hidden">
        {/* Deep 3D background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900 to-red-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/20 to-black/60" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
        {/* Scan lines */}
        <div className="absolute inset-0 scanlines pointer-events-none opacity-40" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left md:max-w-xl">
            <div className="inline-flex items-center space-x-1.5 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <YoutubeIcon className="w-3 h-3 text-red-300" />
              <span>Official YouTube Channel</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Subscribe to Our <span className="text-red-300">YouTube Channel!</span>
            </h3>
            <p className="text-red-200/80 text-sm mt-2 leading-relaxed">
              Watch new song releases, behind-the-scenes recording clips, and exclusive Odia sound mixing tutorials.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@MusicCityOdia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-white text-red-700 font-black px-7 py-3.5 rounded-xl hover:bg-red-50 transition-all shadow-2xl shadow-black/50 hover:scale-105 hover:-translate-y-1 active:translate-y-0 shrink-0"
            style={{ boxShadow: '0 6px 0 0 rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.5)' }}
          >
            <YoutubeIcon className="w-5 h-5 text-red-600" />
            <span>SUBSCRIBE ON YOUTUBE</span>
          </a>
        </div>
      </div>

      {/* ── Main Footer Body ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Studio Profile with 3D Logo */}
          <div className="md:col-span-5 space-y-5">
            {/* Big 3D Logo for footer */}
            <Link to="/" className="inline-flex items-center space-x-4 group">
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden border-3 border-studio-accent/40 shadow-2xl shadow-studio-accent/25 group-hover:shadow-studio-accent/50 transition-all duration-300"
                style={{ boxShadow: '0 0 0 3px rgba(249,115,22,0.3), 0 8px 32px rgba(249,115,22,0.25)' }}
              >
                <img
                  src={logoImg}
                  alt="Music City Odia"
                  className="w-full h-full object-cover logo-img"
                />
                {/* Rim glow */}
                <div className="absolute inset-0 rounded-full border-2 border-white/10 pointer-events-none" />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-white block">
                  Music City{' '}
                  <span className="text-gradient-fire">Odia</span>
                </span>
                <span className="text-xs text-studio-muted uppercase tracking-widest font-bold block mt-0.5">
                  Super Bass Sound Studio
                </span>
              </div>
            </Link>
            
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio. We specialize in vocal dubbing, professional song mixing, mastering, 4K camera coverage, and high-fidelity film editing.
            </p>
            
            {/* Social icons */}
            <div className="flex space-x-3 pt-2">
              <a
                href="https://www.youtube.com/@MusicCityOdia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_16px_rgba(239,68,68,0.3)] hover:scale-110 hover:-translate-y-1 transition-all"
                title="YouTube Channel"
              >
                <YoutubeIcon className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
              <Disc3 className="w-3.5 h-3.5 text-studio-accent animate-spin-slow" style={{ animationDuration: '8s' }} />
              Quick Navigation
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/songs', label: 'Browse Songs' },
                { to: '/about', label: 'About Studio' },
                { to: '/contact', label: 'Contact Us' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-white flex items-center gap-1.5 group transition-all hover:translate-x-1 duration-200"
                  >
                    <ArrowRight className="w-3 h-3 text-studio-accent/0 group-hover:text-studio-accent/100 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-5">
              Contact Info
            </h4>
            <a href="tel:9937987978" className="flex items-start space-x-3 text-sm text-gray-400 hover:text-white transition-all group">
              <Phone className="w-5 h-5 text-studio-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span>+91 9937987978</span>
            </a>
            <a href="mailto:musiccityodia@gmail.com" className="flex items-start space-x-3 text-sm text-gray-400 hover:text-white transition-all group break-all">
              <Mail className="w-5 h-5 text-studio-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span>musiccityodia@gmail.com</span>
            </a>
            <div className="flex items-start space-x-3 text-sm text-gray-400">
              <MapPin className="w-5 h-5 text-studio-accent shrink-0 mt-0.5" />
              <span>Odisha, India</span>
            </div>

            {/* Studio badge */}
            <div className="mt-6 glass-3d p-4 rounded-xl border border-studio-accent/15 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Studio Online</span>
              </div>
              <p className="text-xs text-gray-500">24-Bit / 48kHz Master Quality</p>
              <p className="text-xs text-gray-500">Google Drive Cloud Vault Active</p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/6 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Music City Odia. All Rights Reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-studio-accent fill-studio-accent animate-pulse" /> for Odia Music Lovers
          </p>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-studio-accent/20 to-transparent" />
    </footer>
  );
};
