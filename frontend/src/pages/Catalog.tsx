import React, { useEffect, useState } from 'react';
import { api, type SongRecord } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCart } from '../context/CartContext';
import { Search, Play, Pause, ShoppingCart, Check, Music, Disc, HardDrive, Volume2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card3D } from '../components/Card3D';

interface Genre {
  id: string;
  name: string;
}

export const Catalog: React.FC = () => {
  const [songs, setSongs] = useState<SongRecord[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { play, currentSong, isPlaying, togglePlay } = useAudioPlayer();
  const { addToCart, isInCart } = useCart();

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await api.genres.list();
        setGenres(data);
      } catch (err) {
        console.error('Error loading genres:', err);
      }
    };
    loadGenres();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.songs.list(
        selectedGenre || undefined,
        searchQuery || undefined
      );
      setSongs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch songs catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSongs();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedGenre, searchQuery]);

  const handlePlayPreview = (song: SongRecord) => {
    const songData: Song = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      preview_url: song.preview_url,
      cover_url: song.cover_url,
      price: Number(song.price)
    };

    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      play(songData, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen text-left relative z-10">
      
      {/* 3D Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-studio-border/70 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-studio-accent uppercase tracking-wider bg-studio-accent/10 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Master Vault</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Odia Music Store</h1>
          <p className="text-studio-muted text-sm sm:text-base mt-1.5 max-w-xl">
            Stream high-fidelity studio previews and download master tracks backed by Google Drive cloud storage.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 rounded-xl self-start md:self-auto">
          <HardDrive className="w-4 h-4" />
          <span>Google Drive API Sync Active</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by song, singer, or album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-studio-card border border-studio-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
          />
        </div>

        {/* Genres Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedGenre('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedGenre === ''
                ? 'bg-studio-accent text-white border-studio-accent shadow-lg shadow-studio-accent/25'
                : 'bg-studio-card text-gray-400 border-studio-border hover:border-gray-500 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedGenre === genre.id
                  ? 'bg-studio-accent text-white border-studio-accent shadow-lg shadow-studio-accent/25'
                  : 'bg-studio-card text-gray-400 border-studio-border hover:border-gray-500 hover:text-white'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

      </div>

      {/* Songs Grid */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-3d border border-studio-border rounded-2xl p-4 animate-pulse space-y-4">
              <div className="aspect-square bg-studio-border/60 rounded-xl"></div>
              <div className="h-4 bg-studio-border/60 rounded w-2/3"></div>
              <div className="h-3 bg-studio-border/60 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-24 glass-3d border border-studio-border rounded-3xl">
          <Music className="w-14 h-14 text-studio-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-xl font-bold text-white">No tracks found</h3>
          <p className="text-sm text-studio-muted mt-1">Try resetting the genre filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((song) => {
            const inCart = isInCart(song.id);
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            const songData: Song = {
              id: song.id,
              title: song.title,
              artist: song.artist,
              preview_url: song.preview_url,
              cover_url: song.cover_url,
              price: Number(song.price)
            };
            
            return (
              <Card3D key={song.id} maxTilt={10} scale={1.03}>
                <div className="h-full glass-3d border border-studio-border hover:border-studio-accent/40 rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-studio-accent/15 flex flex-col justify-between preserve-3d group">
                  
                  {/* Artwork Container with 3D Depth */}
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-studio-border depth-2 preserve-3d shadow-xl">
                    <img
                      src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'}
                      alt={song.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Google Drive Verified Badge */}
                    {song.drive_file_id && (
                      <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 p-1.5 rounded-lg shadow-md depth-3" title="Google Drive Master Audio">
                        <HardDrive className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handlePlayPreview(song)}
                        className="w-14 h-14 rounded-full bg-studio-accent text-white flex items-center justify-center transform group-hover:scale-105 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-studio-accent/50 depth-4"
                        title={isCurrentPlaying ? "Pause Preview" : "Play Preview"}
                      >
                        {isCurrentPlaying ? (
                          <Pause className="w-6 h-6 fill-white" />
                        ) : (
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Playing indicator */}
                    {isCurrentPlaying && (
                      <div className="absolute bottom-2.5 left-2.5 bg-black/85 backdrop-blur-md border border-studio-accent/50 text-studio-accent px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 depth-3">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        <span>Playing</span>
                      </div>
                    )}
                  </div>

                  {/* Details with Depth */}
                  <div className="space-y-1 mb-4 flex-1 depth-1">
                    <Link to={`/songs/${song.id}`} className="font-extrabold text-white hover:text-studio-accent transition-colors truncate block text-base">
                      {song.title}
                    </Link>
                    <p className="text-xs text-studio-gold truncate font-semibold">{song.artist}</p>
                    {song.album && (
                      <p className="text-[11px] text-studio-muted truncate flex items-center gap-1">
                        <Disc className="w-3 h-3 shrink-0 text-studio-accent/70" />
                        <span>{song.album}</span>
                      </p>
                    )}
                  </div>

                  {/* Pricing & Add to Cart / Details */}
                  <div className="flex items-center justify-between pt-3 border-t border-studio-border/50 mt-auto depth-2">
                    <div>
                      <span className="text-[10px] text-studio-muted block uppercase tracking-wider font-semibold">Price</span>
                      <span className="text-white font-black text-lg">
                        {song.price === 0 ? <span className="text-emerald-400 text-xs">FREE</span> : `₹${song.price}`}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addToCart(songData)}
                        disabled={inCart}
                        className={`p-2.5 rounded-xl transition-all border ${
                          inCart
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'btn-3d bg-studio-accent text-white'
                        }`}
                        title={inCart ? 'Already in cart' : 'Add to cart'}
                      >
                        {inCart ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingCart className="w-4 h-4" />}
                      </button>
                      <Link
                        to={`/songs/${song.id}`}
                        className="btn-3d-secondary text-xs font-bold text-gray-200 hover:text-white px-3.5 py-2.5 rounded-xl flex items-center justify-center"
                      >
                        Details
                      </Link>
                    </div>
                  </div>

                </div>
              </Card3D>
            );
          })}
        </div>
      )}

    </div>
  );
};
