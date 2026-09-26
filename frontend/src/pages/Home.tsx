import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import {
  Mic,
  Headphones,
  Film,
  Radio,
  Flame,
  Play,
  ArrowRight,
  HardDrive,
  Disc,
  Volume2
} from 'lucide-react';
import { YoutubeIcon } from '../components/YoutubeIcon';
import { Card3D } from '../components/Card3D';
import { VinylArtwork3D } from '../components/VinylArtwork3D';


export const Home: React.FC = () => {
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { play, currentSong, isPlaying } = useAudioPlayer();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const songs = await api.songs.list();
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
    play(song, true);
  };

  const services = [
    {
      icon: <Mic className="w-8 h-8 text-studio-accent" />,
      title: 'Vocal & Music Recording',
      description: 'Professional multi-track voice recordings with Neumann microphones and floating acoustic isolation chambers.',
      badge: 'Super Bass Rig'
    },
    {
      icon: <Headphones className="w-8 h-8 text-studio-accent" />,
      title: 'Mixing & Mastering',
      description: 'High-definition stereo imaging, low-end punch, and acoustic warmth ready for global streaming.',
      badge: 'Dolby & 320kbps'
    },
    {
      icon: <Radio className="w-8 h-8 text-studio-accent" />,
      title: 'Voice Dubbing & Voiceover',
      description: 'Film dubbing, serial dialogues, commercials, and regional Odia speech sync with studio fidelity.',
      badge: 'Acoustic Treated'
    },
    {
      icon: <Film className="w-8 h-8 text-studio-accent" />,
      title: 'Camera & Film Editing',
      description: 'Cinematic 4K color grading, multi-camera coverage, and music video post-production.',
      badge: '4K Master Edit'
    }
  ];

  const heroSong = featuredSongs[0] || {
    id: 'hero-track',
    title: 'Mu Odia Toka (Super Bass Mix)',
    artist: 'Music City Singer',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    price: 19
  };

  return (
    <div className="space-y-24 pb-24 relative z-10">
      
      {/* 3D Immersive Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-12 overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Text & 3D CTAs - 7 Cols */}
          <div className="lg:col-span-7 text-left space-y-7 relative z-20">
            


            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-2xl">
              Super Bass Sound Studio in{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-studio-accent via-amber-400 to-studio-gold">
                Odisha
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed font-normal">
              Experience the highest clarity acoustics, punchy Odia beats, and master-quality vocal engineering. Stream, purchase, and download tracks powered by our Google Drive audio vault.
            </p>

            {/* 3D Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/songs"
                className="btn-3d bg-studio-accent text-white px-8 py-4 text-base font-extrabold flex items-center justify-center space-x-2 text-center"
              >
                <Disc className="w-5 h-5 animate-spin-slow" />
                <span>Explore Music Store</span>
              </Link>
              
              <Link
                to="/contact"
                className="btn-3d-secondary text-white px-8 py-4 text-base font-bold flex items-center justify-center space-x-2 text-center"
              >
                <Mic className="w-5 h-5 text-studio-accent" />
                <span>Book Recording Session</span>
              </Link>
            </div>

            {/* Floating Studio Metric Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-studio-border/70 text-xs">
              <div>
                <div className="text-2xl font-black text-white">500+</div>
                <div className="text-studio-muted mt-0.5">Odia Songs Recorded</div>
              </div>
              <div>
                <div className="text-2xl font-black text-studio-gold">320kbps</div>
                <div className="text-studio-muted mt-0.5">Drive Master Quality</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">100%</div>
                <div className="text-studio-muted mt-0.5">Original Odia Studio</div>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Floating Extruded Vinyl Showcase - 5 Cols */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            <Card3D maxTilt={16} scale={1.04} className="w-full max-w-md">
              <div className="glass-3d p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden preserve-3d">
                
                {/* Floating Studio Header */}
                <div className="flex items-center justify-between mb-6 depth-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-studio-accent animate-ping" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Now Featuring</span>
                  </div>
                  <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>Drive Master</span>
                  </span>
                </div>

                {/* 3D Vinyl Element */}
                <div className="flex justify-center my-4 depth-4">
                  <VinylArtwork3D
                    coverUrl={heroSong.cover_url}
                    title={heroSong.title}
                    isPlaying={currentSong?.id === heroSong.id && isPlaying}
                    isDriveBacked={true}
                    onPlayToggle={() => handlePlayClick(heroSong)}
                    size="md"
                  />
                </div>

                {/* Track Info */}
                <div className="text-center space-y-1.5 mt-6 depth-3">
                  <h3 className="text-xl font-extrabold text-white truncate hover:text-studio-accent transition-colors">
                    {heroSong.title}
                  </h3>
                  <p className="text-sm font-semibold text-studio-gold truncate">
                    {heroSong.artist}
                  </p>
                </div>

                {/* Card Bottom CTA */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-studio-border/60 depth-2">
                  <div>
                    <span className="text-[10px] text-studio-muted uppercase tracking-wider block">Single Track</span>
                    <span className="text-lg font-black text-white">₹{heroSong.price}</span>
                  </div>
                  
                  <Link
                    to={`/songs/${heroSong.id}`}
                    className="btn-3d bg-studio-accent text-white px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Play & Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </Card3D>
          </div>

        </div>

      </section>

      {/* Featured Songs 3D Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 text-left">
          <div>
            <div className="flex items-center space-x-2 text-studio-accent font-bold text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-current" />
              <span>Studio Chartbusters</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Trending Releases</h2>
          </div>
          
          <Link to="/songs" className="flex items-center text-studio-accent hover:text-white text-sm font-semibold group transition-colors">
            <span>View Full Studio Store</span>
            <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-studio-card border border-studio-border rounded-2xl p-4 animate-pulse space-y-4">
                <div className="aspect-square bg-studio-border rounded-xl"></div>
                <div className="h-4 bg-studio-border rounded w-2/3"></div>
                <div className="h-3 bg-studio-border rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSongs.map((song) => {
              const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
              return (
                <Card3D key={song.id} maxTilt={10} scale={1.03}>
                  <div className="h-full bg-studio-card border border-studio-border hover:border-studio-accent/40 rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-studio-accent/10 flex flex-col justify-between preserve-3d">
                    
                    {/* Artwork with 3D Depth */}
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-studio-border depth-2">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'}
                        alt={song.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Play Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handlePlayClick(song)}
                          className="w-14 h-14 rounded-full bg-studio-accent text-white flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all shadow-xl shadow-studio-accent/50"
                        >
                          {isCurrentPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 mb-4 flex-1 text-left depth-1">
                      <Link to={`/songs/${song.id}`} className="font-bold text-white hover:text-studio-accent transition-colors truncate block text-base">
                        {song.title}
                      </Link>
                      <p className="text-xs text-studio-gold font-medium truncate">{song.artist}</p>
                    </div>

                    {/* Pricing & Details Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-studio-border/60 mt-auto depth-2">
                      <span className="text-white font-extrabold text-base">₹{song.price}</span>
                      <Link
                        to={`/songs/${song.id}`}
                        className="btn-3d bg-studio-accent text-white text-xs font-bold px-4 py-2"
                      >
                        Play Track
                      </Link>
                    </div>

                  </div>
                </Card3D>
              );
            })}
          </div>
        )}
      </section>

      {/* 3D Studio Services Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 text-studio-accent font-bold text-xs uppercase tracking-wider bg-studio-accent/10 px-3 py-1 rounded-full">
            <Mic className="w-3.5 h-3.5" />
            <span>Sound Production Facilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Our Studio Services</h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Equipped with high-end acoustic chambers, master mixing consoles, and 4K film editing rigs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((svc, i) => (
            <Card3D key={i} maxTilt={14} scale={1.03}>
              <div className="h-full glass-3d border border-studio-border hover:border-studio-accent/40 p-7 rounded-2xl space-y-5 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-studio-accent/15 flex flex-col justify-between preserve-3d">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-studio-accent/10 border border-studio-accent/25 rounded-2xl flex items-center justify-center depth-3 shadow-inner">
                    {svc.icon}
                  </div>
                  <div className="depth-2 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-studio-gold tracking-wider block">
                      {svc.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-snug">{svc.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed depth-1">
                    {svc.description}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-studio-border/50 depth-1">
                  <Link to="/contact" className="text-xs font-bold text-studio-accent hover:text-white flex items-center gap-1 group">
                    <span>Inquire Session</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* Studio Promo / YouTube Embed in 3D Glass Stage */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card3D maxTilt={6} scale={1.01}>
          <div className="glass-3d border border-studio-border rounded-3xl p-6 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center text-left preserve-3d">
            <div className="space-y-6 depth-2">
              <div className="inline-flex items-center space-x-2 bg-red-600/10 text-red-500 border border-red-500/25 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <YoutubeIcon className="w-4 h-4" />
                <span>Official YouTube Feed</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Experience Music City Odia Studio in Motion
              </h2>
              
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Listen to the latest music videos, studio recordings, and Sambalpuri chartbusters recorded live in our studio. Subscribe for weekly Odia song drops!
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <a
                  href="https://www.youtube.com/@MusicCityOdia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-3d bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-xl shadow-red-600/25 flex items-center space-x-2"
                >
                  <YoutubeIcon className="w-5 h-5" />
                  <span>Visit YouTube Channel</span>
                </a>
              </div>
            </div>
            
            {/* 3D Visual Screen Box */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center group depth-3">
              <img
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=700"
                alt="Mixing Desk"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <a
                href="https://www.youtube.com/@MusicCityOdia"
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-18 h-18 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-red-600/50 cursor-pointer"
              >
                <Play className="w-7 h-7 fill-white ml-1" />
              </a>
            </div>
          </div>
        </Card3D>
      </section>

    </div>
  );
};
