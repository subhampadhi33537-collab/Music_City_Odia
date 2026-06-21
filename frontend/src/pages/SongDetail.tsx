import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, ShoppingCart, ArrowLeft, Clock, Tag, FileAudio, Check, Library } from 'lucide-react';

export const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { play, currentSong, isPlaying, togglePlay } = useAudioPlayer();
  const { addToCart, isInCart } = useCart();

  const [song, setSong] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    const loadSongDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.songs.get(id);
        setSong(data);
        
        // Check if user already owns this song
        if (user) {
          try {
            const purchases = await api.orders.listPurchases();
            const owned = purchases.some((p: any) => p.song_id === id);
            setIsPurchased(owned);
          } catch (err) {
            console.error('Error loading user purchases:', err);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load song details.');
      } finally {
        setLoading(false);
      }
    };

    loadSongDetails();
  }, [id, user]);

  const handlePlayClick = () => {
    if (!song) return;
    
    // Play preview
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

  if (loading) {
    return (
      <div className="min-h-screen bg-studio-dark flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-studio-border rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-studio-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Error loading song</h2>
        <p className="text-red-400">{error || 'Song not found'}</p>
        <Link to="/songs" className="inline-flex items-center text-studio-accent hover:text-white font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
        </Link>
      </div>
    );
  }

  const formatDuration = (sec?: number) => {
    if (!sec) return 'N/A';
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
  const inCart = isInCart(song.id);

  const songPayload: Song = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    preview_url: song.preview_url,
    cover_url: song.cover_url,
    price: Number(song.price)
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 min-h-screen">
      
      {/* Back button */}
      <div>
        <Link to="/songs" className="inline-flex items-center text-gray-400 hover:text-white text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Catalog
        </Link>
      </div>

      {/* Main Info Box */}
      <div className="glass border border-studio-border rounded-2xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-center">
        
        {/* Cover Art - Column 1 */}
        <div className="md:col-span-5 relative group aspect-square rounded-xl overflow-hidden bg-studio-border border border-studio-border">
          <img
            src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600'}
            alt={song.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePlayClick}
              className="w-16 h-16 rounded-full bg-studio-accent text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
            >
              {isCurrentPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1.5" />}
            </button>
          </div>
        </div>

        {/* Details - Column 2 */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold bg-studio-border text-studio-accent border border-studio-border px-2.5 py-1 rounded-full uppercase tracking-wider">
              {song.genres?.name || 'Odia Song'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{song.title}</h1>
            <p className="text-lg text-studio-gold font-medium">{song.artist}</p>
          </div>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            {song.description || 'This premium track was produced and master-mixed inside the Music City Odia Super Bass Sound Studio. Experience outstanding vocals and crystal clear acoustic instruments.'}
          </p>

          {/* Technical Specs row */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-studio-border">
            <div className="flex items-center space-x-2 text-xs">
              <Clock className="w-4 h-4 text-studio-accent" />
              <div>
                <span className="text-studio-muted block">Duration</span>
                <span className="text-white font-medium">{formatDuration(song.duration_seconds)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <Tag className="w-4 h-4 text-studio-accent" />
              <div>
                <span className="text-studio-muted block">Price</span>
                <span className="text-white font-medium">₹{song.price}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <FileAudio className="w-4 h-4 text-studio-accent" />
              <div>
                <span className="text-studio-muted block">Format</span>
                <span className="text-white font-medium">HQ MP3 (320kbps)</span>
              </div>
            </div>
          </div>

          {/* Purchase Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            
            {/* Play Preview button */}
            <button
              onClick={handlePlayClick}
              className="flex items-center justify-center space-x-2 border border-studio-border hover:border-studio-accent/40 text-white font-bold px-6 py-3.5 rounded-lg bg-studio-card hover:bg-studio-border transition-all"
            >
              {isCurrentPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span>Listen Preview</span>
                </>
              )}
            </button>

            {/* Buy / Cart Action */}
            {isPurchased ? (
              <Link
                to="/library"
                className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Library className="w-5 h-5" />
                <span>Go to My Library</span>
              </Link>
            ) : inCart ? (
              <Link
                to="/cart"
                className="flex-1 flex items-center justify-center space-x-2 bg-studio-border border border-studio-border hover:border-studio-accent/40 text-white font-bold px-6 py-3.5 rounded-lg transition-all"
              >
                <Check className="w-5 h-5 text-emerald-500" />
                <span>View in Cart</span>
              </Link>
            ) : (
              <button
                onClick={() => addToCart(songPayload)}
                className="flex-1 flex items-center justify-center space-x-2 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold px-6 py-3.5 rounded-lg transition-colors shadow-lg shadow-studio-accent/25"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart (₹{song.price})</span>
              </button>
            )}

          </div>
        </div>

      </div>

      {/* Info details / specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-studio-card border border-studio-border p-6 sm:p-8 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Purchase Includes</h3>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Full-quality audio stream in your client library dashboard</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Unlimited downloads of high fidelity MP3 audio files</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>No advertisements, watermarks, or audio interrupts</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>100% legal purchase supporting Odia vocalists & producers</span>
            </li>
          </ul>
        </div>

        <div className="bg-studio-card border border-studio-border p-6 sm:p-8 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Studio Support</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Need high-resolution WAV files, custom stems, or instrumental files for dubbing? Music City Odia Studio is ready to assist. Reach us at <a href="tel:9937987978" className="text-studio-accent font-semibold hover:underline">+91 9937987978</a> or write to <a href="mailto:musiccityodia@gmail.com" className="text-studio-accent font-semibold hover:underline">musiccityodia@gmail.com</a>.
          </p>
        </div>
      </div>

    </div>
  );
};
