import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCart } from '../context/CartContext';
import { Search, Play, Pause, ShoppingCart, Check, Music } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Genre {
  id: string;
  name: string;
}

export const Catalog: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
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
    // Debounce/trigger load on genre or search query change
    const delayDebounceFn = setTimeout(() => {
      loadSongs();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedGenre, searchQuery]);

  const handlePlayPreview = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      play(song, true); // Play 30s preview
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      
      {/* Page Header */}
      <div className="text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Music Store</h1>
        <p className="text-studio-muted text-sm sm:text-base mt-1">
          Listen to studio previews and buy full-quality studio tracks.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by song name, artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-studio-card border border-studio-border rounded-lg pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50 transition-colors"
          />
        </div>

        {/* Genres Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedGenre('')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedGenre === ''
                ? 'bg-studio-accent text-white border-studio-accent shadow-md shadow-studio-accent/20'
                : 'bg-studio-card text-gray-400 border-studio-border hover:border-gray-500 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedGenre === genre.id
                  ? 'bg-studio-accent text-white border-studio-accent shadow-md shadow-studio-accent/20'
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
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-studio-card border border-studio-border rounded-xl p-4 animate-pulse space-y-4">
              <div className="aspect-square bg-studio-border rounded-lg"></div>
              <div className="h-4 bg-studio-border rounded w-2/3"></div>
              <div className="h-3 bg-studio-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-20 bg-studio-card/30 border border-studio-border rounded-2xl">
          <Music className="w-12 h-12 text-studio-muted mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No songs found</h3>
          <p className="text-sm text-studio-muted mt-1">Try resetting the filters or modifying your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((song) => {
            const inCart = isInCart(song.id);
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            
            return (
              <div
                key={song.id}
                className="group bg-studio-card border border-studio-border hover:border-studio-accent/40 rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-studio-accent/5 flex flex-col justify-between"
              >
                {/* Artwork */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-studio-border">
                  <img
                    src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'}
                    alt={song.title}
                    className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-300"
                  />
                  
                  {/* Play Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handlePlayPreview(song)}
                      className="w-12 h-12 rounded-full bg-studio-accent text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-lg"
                    >
                      {isCurrentPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 mb-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/songs/${song.id}`} className="font-bold text-white hover:text-studio-accent transition-colors truncate block">
                      {song.title}
                    </Link>
                  </div>
                  <p className="text-xs text-studio-muted truncate">{song.artist}</p>
                </div>

                {/* Pricing & Add to Cart */}
                <div className="flex items-center justify-between pt-3 border-t border-studio-border/50 mt-auto">
                  <div>
                    <span className="text-[10px] text-studio-muted block uppercase tracking-wider font-semibold">Price</span>
                    <span className="text-studio-gold font-bold text-lg">₹{song.price}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(song)}
                      disabled={inCart}
                      className={`p-2 rounded-lg transition-all border ${
                        inCart
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-studio-accent text-white border-studio-accent hover:bg-studio-accent/90 shadow-md shadow-studio-accent/15'
                      }`}
                      title={inCart ? 'Already in cart' : 'Add to cart'}
                    >
                      {inCart ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    </button>
                    <Link
                      to={`/songs/${song.id}`}
                      className="text-xs font-semibold bg-studio-border border border-studio-border text-gray-300 hover:text-white hover:border-studio-accent/30 px-3.5 py-2.5 rounded-lg flex items-center justify-center transition-all"
                    >
                      Details
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
