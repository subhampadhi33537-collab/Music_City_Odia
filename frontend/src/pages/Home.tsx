import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Mic, Headphones, Film, Radio, Flame, Play, ArrowRight, Star } from 'lucide-react';
import { YoutubeIcon } from '../components/YoutubeIcon';

export const Home: React.FC = () => {
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { play } = useAudioPlayer();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const songs = await api.songs.list();
        // Take featured songs or top 4
        const featured = songs.filter((s: any) => s.is_featured).slice(0, 4);
        setFeaturedSongs(featured.length > 0 ? featured : songs.slice(0, 4));
      } catch (err) {
        console.error('Error fetching songs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handlePlayClick = (song: Song) => {
    play(song, true); // Play 30s preview
  };

  const services = [
    {
      icon: <Mic className="w-8 h-8 text-studio-accent" />,
      title: 'Vocal & Music Recording',
      description: 'Professional multi-track voice recordings with top-tier condenser microphones and acoustic treatment.'
    },
    {
      icon: <Headphones className="w-8 h-8 text-studio-accent" />,
      title: 'Mixing & Mastering',
      description: 'Super Bass Sound engineering to give your music wide stereo imagery, warmth, and club-ready loudness.'
    },
    {
      icon: <Radio className="w-8 h-8 text-studio-accent" />,
      title: 'Voice Dubbing & Voiceover',
      description: 'High-quality dubbing for films, advertisements, and serials with accurate lip-syncing capability.'
    },
    {
      icon: <Film className="w-8 h-8 text-studio-accent" />,
      title: 'Camera & Film Editing',
      description: 'Video coverage, color grading, post-production editing, and music video graphics editing services.'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-12">
        {/* Ambient lighting effects */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-studio-accent/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        
        {/* Equalizer animation background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          <div className="flex items-end space-x-2 h-96">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="w-4 bg-studio-accent rounded-t"
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  animation: `equalizer ${Math.random() * 0.8 + 0.6}s ease-in-out infinite alternate`
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
          <div className="inline-flex items-center space-x-2 bg-studio-card/80 border border-studio-border px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-studio-gold uppercase">
            <Star className="w-3.5 h-3.5 fill-studio-gold" />
            <span>Super Bass Sound Studio</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] select-none">
            No.1 Quality Audio Sound in <span className="bg-clip-text text-transparent bg-gradient-to-r from-studio-accent to-studio-gold">Odisha</span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Record, Dub, Mix, and Edit your films at Music City Odia Studio. Experience the highest clarity audio sound and bass fidelity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/songs"
              className="w-full sm:w-auto bg-studio-accent text-white px-8 py-3.5 rounded-lg font-bold hover:bg-studio-accent/90 transition-all shadow-lg shadow-studio-accent/25 hover:-translate-y-0.5"
            >
              Browse Music Store
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto bg-studio-card border border-studio-border text-white px-8 py-3.5 rounded-lg font-bold hover:bg-studio-border hover:border-studio-accent/30 transition-all hover:-translate-y-0.5"
            >
              Book Recording Session
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Songs Catalog Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="text-left">
            <div className="flex items-center space-x-2 text-studio-accent font-semibold text-sm uppercase tracking-wider">
              <Flame className="w-5 h-5 fill-current" />
              <span>Trending Hits</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Featured Releases</h2>
          </div>
          <Link to="/songs" className="flex items-center text-studio-accent hover:text-white text-sm font-semibold group transition-colors">
            <span>View Full Catalog</span>
            <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-studio-card border border-studio-border rounded-xl p-4 animate-pulse space-y-4">
                <div className="aspect-square bg-studio-border rounded-lg"></div>
                <div className="h-4 bg-studio-border rounded w-2/3"></div>
                <div className="h-3 bg-studio-border rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSongs.map((song) => (
              <div
                key={song.id}
                className="group bg-studio-card border border-studio-border hover:border-studio-accent/40 rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-studio-accent/5 relative overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-studio-border">
                  <img
                    src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'}
                    alt={song.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Hover Overlay Play button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handlePlayClick(song)}
                      className="w-12 h-12 rounded-full bg-studio-accent text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-lg"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <Link to={`/songs/${song.id}`} className="font-bold text-white hover:text-studio-accent transition-colors truncate block">
                    {song.title}
                  </Link>
                  <p className="text-xs text-studio-muted truncate">{song.artist}</p>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-studio-border/50">
                  <span className="text-studio-gold font-bold text-sm">₹{song.price}</span>
                  <Link
                    to={`/songs/${song.id}`}
                    className="text-xs font-semibold bg-studio-border border border-studio-border text-gray-300 hover:text-white hover:border-studio-accent/30 px-3 py-1.5 rounded transition-all"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Our Studio Services</h2>
          <p className="text-gray-400 text-sm sm:text-base mt-3">
            Equipped with state-of-the-art software and sound hardware to satisfy all recording demands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((svc, i) => (
            <div
              key={i}
              className="bg-studio-card/50 border border-studio-border p-6 rounded-xl space-y-4 hover:bg-studio-card transition-colors hover:border-studio-accent/20"
            >
              <div className="w-14 h-14 bg-studio-border rounded-lg flex items-center justify-center">
                {svc.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{svc.title}</h3>
              <p className="text-sm text-studio-muted leading-relaxed">{svc.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Studio Promo / YouTube Embed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass border border-studio-border rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-red-600/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <YoutubeIcon className="w-4 h-4" />
              <span>Official Channel</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Watch Music City Odia Studio in Action!
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
              Listen to the latest music videos, Odia vocal tracks, and sambalpuri audio tracks recorded live at our state-of-the-art location in Odisha. Click to visit our official YouTube feed.
            </p>
            <div className="pt-2">
              <a
                href="https://www.youtube.com/@MusicCityOdia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-red-600 text-white font-bold px-6 py-3.5 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                <YoutubeIcon className="w-5 h-5" />
                <span>Visit YouTube Channel</span>
              </a>
            </div>
          </div>
          
          {/* Audio Equalizer visual block or a beautiful placeholder image */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-studio-border shadow-2xl bg-black/40 flex items-center justify-center group">
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=700"
              alt="Mixing Desk"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-500"
            />
            {/* Play Button Overlay linking to youtube */}
            <a
              href="https://www.youtube.com/@MusicCityOdia"
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/40 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white ml-1" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
