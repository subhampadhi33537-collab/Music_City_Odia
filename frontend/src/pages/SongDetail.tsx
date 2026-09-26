import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type SongRecord } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Pause,
  ShoppingCart,
  ArrowLeft,
  Clock,
  Tag,
  FileAudio,
  Check,
  Library,
  Share2,
  Download,
  HardDrive,
  Disc,
  Copy,
  MessageCircle,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Card3D } from '../components/Card3D';
import { VinylArtwork3D } from '../components/VinylArtwork3D';

export const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { play, currentSong, isPlaying, togglePlay } = useAudioPlayer();
  const { addToCart, isInCart } = useCart();

  const [song, setSong] = useState<SongRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  const handleShareWhatsApp = () => {
    if (!song) return;
    const url = window.location.href;
    const text = `Listen to "${song.title}" by ${song.artist} on Music City Odia Studio:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert('Link copied to clipboard!');
    }
  };

  const handleNativeShare = async () => {
    if (!song) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} — Music City Odia`,
          text: `Check out ${song.title} by ${song.artist} on Music City Odia!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownload = async () => {
    if (!song) return;
    setDownloadLoading(true);
    try {
      if (isPurchased || song.price === 0) {
        const resp = await api.songs.getDownloadUrl(song.id);
        if (resp.download_url) {
          window.open(resp.download_url, '_blank');
        } else {
          window.open(song.preview_url, '_blank');
        }
      } else {
        // Fallback: download 30s preview clip
        window.open(song.preview_url, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Download error. Please ensure you are logged in.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-studio-dark flex items-center justify-center">
        <div className="relative w-20 h-20 perspective-1000">
          <div className="absolute inset-0 border-4 border-studio-border rounded-full animate-spin-slow"></div>
          <div className="absolute inset-0 border-4 border-t-studio-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Error loading track</h2>
        <p className="text-red-400">{error || 'Song not found'}</p>
        <Link to="/songs" className="inline-flex items-center text-studio-accent hover:text-white font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
        </Link>
      </div>
    );
  }

  const formatDuration = (sec?: number) => {
    if (!sec) return '3:45';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 min-h-screen text-left relative z-10">
      
      {/* Back button */}
      <div>
        <Link to="/songs" className="inline-flex items-center text-gray-400 hover:text-white text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Music Catalog
        </Link>
      </div>

      {/* 3D Master Studio Stage Box */}
      <Card3D maxTilt={6} scale={1.01}>
        <div className="glass-3d border border-white/10 rounded-3xl p-6 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center relative overflow-hidden preserve-3d">
          
          {/* Ambient Lighting Cones */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-studio-accent/15 rounded-full blur-[120px] pointer-events-none -mr-28 -mt-28" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20" />

          {/* 3D Extruded Floating Vinyl Artwork - Column 1 */}
          <div className="md:col-span-5 flex justify-center items-center depth-4">
            <VinylArtwork3D
              coverUrl={song.cover_url}
              title={song.title}
              isPlaying={isCurrentPlaying}
              isDriveBacked={!!song.drive_file_id}
              onPlayToggle={handlePlayClick}
              size="lg"
            />
          </div>

          {/* Details & Actions - Column 2 */}
          <div className="md:col-span-7 space-y-7 relative z-10 depth-2">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold bg-studio-accent/20 text-studio-accent border border-studio-accent/35 px-3 py-1 rounded-full uppercase tracking-wider">
                  {song.genres?.name || 'Odia Music'}
                </span>
                {song.album && (
                  <span className="text-xs font-semibold bg-studio-card/80 text-gray-200 border border-studio-border px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Disc className="w-3.5 h-3.5 text-studio-gold" />
                    <span>Album: {song.album}</span>
                  </span>
                )}
                {song.drive_file_id && (
                  <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Google Drive Master</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
                {song.title}
              </h1>
              <p className="text-xl sm:text-2xl text-studio-gold font-bold">
                {song.artist}
              </p>
            </div>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-normal">
              {song.description || 'This premium Odia track was produced and master-mixed inside Music City Odia Super Bass Sound Studio. Master files stored and distributed via Google Drive.'}
            </p>

            {/* Technical Specs 3D Shelf */}
            <div className="grid grid-cols-3 gap-4 py-4 px-5 rounded-2xl bg-studio-dark/60 border border-studio-border/80 text-xs shadow-inner">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-studio-accent shrink-0" />
                <div>
                  <span className="text-studio-muted block text-[11px]">Duration</span>
                  <span className="text-white font-bold">{formatDuration(song.duration_seconds)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <Tag className="w-4 h-4 text-studio-gold shrink-0" />
                <div>
                  <span className="text-studio-muted block text-[11px]">Price</span>
                  <span className="text-white font-extrabold">{song.price === 0 ? 'FREE' : `₹${song.price}`}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-studio-muted block text-[11px]">Format</span>
                  <span className="text-white font-bold">320kbps Master</span>
                </div>
              </div>
            </div>

            {/* 3D Action Controls */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center pt-1">
              
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayClick}
                className="btn-3d-secondary text-white font-bold px-7 py-4 rounded-xl flex items-center justify-center space-x-2.5 text-base"
              >
                {isCurrentPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current text-studio-accent" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current ml-0.5 text-studio-accent" />
                    <span>Play Preview</span>
                  </>
                )}
              </button>

              {/* Buy / Library / Cart Button */}
              {isPurchased ? (
                <Link
                  to="/library"
                  className="flex-1 btn-3d bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center space-x-2"
                >
                  <Library className="w-5 h-5" />
                  <span>Owned (Go to Library)</span>
                </Link>
              ) : inCart ? (
                <Link
                  to="/cart"
                  className="flex-1 btn-3d-secondary text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>View in Cart</span>
                </Link>
              ) : (
                <button
                  onClick={() => addToCart(songPayload)}
                  className="flex-1 btn-3d bg-studio-accent text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center space-x-2 text-base"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart (₹{song.price})</span>
                </button>
              )}

              {/* Direct Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="btn-3d-secondary text-gray-200 hover:text-white px-5 py-4 rounded-xl flex items-center justify-center space-x-2"
                title={isPurchased ? "Download Full Master Track" : "Download Audio Preview"}
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">{downloadLoading ? '...' : 'Download'}</span>
              </button>

            </div>

            {/* Social Share Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <span className="text-studio-muted font-bold flex items-center gap-1.5 mr-1">
                <Share2 className="w-3.5 h-3.5 text-studio-accent" /> Share Track:
              </span>

              <button
                onClick={handleNativeShare}
                className="flex items-center space-x-1.5 bg-studio-card/80 text-gray-200 hover:text-white border border-studio-border hover:border-studio-accent/40 px-3 py-1.5 rounded-lg font-semibold transition-all"
                title="Share track"
              >
                <Share2 className="w-3.5 h-3.5 text-studio-accent" />
                <span>Share</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center space-x-1.5 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border border-[#25D366]/35 px-3 py-1.5 rounded-lg font-semibold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 bg-studio-card/80 text-gray-300 hover:text-white border border-studio-border px-3 py-1.5 rounded-lg font-semibold transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {song.drive_web_link && (
                <a
                  href={song.drive_web_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold transition-all"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Drive Master File</span>
                </a>
              )}
            </div>

          </div>

        </div>
      </Card3D>

      {/* 3D Lyrics & Studio Authenticity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lyrics Parchment Box - 7 Cols */}
        <div className="lg:col-span-7 glass-3d border border-studio-border p-6 sm:p-9 rounded-3xl space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-studio-border/70 pb-4">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-studio-accent" />
              <span>Song Lyrics / ଗୀତ ଲିରିକ୍ସ</span>
            </h3>
            <span className="text-xs text-studio-gold font-bold uppercase tracking-wider">
              {song.album || 'Studio Master Track'}
            </span>
          </div>

          {song.lyrics && song.lyrics.trim().length > 0 ? (
            <div className="bg-studio-card/60 border border-studio-border/70 rounded-2xl p-6 text-sm sm:text-base text-gray-200 leading-loose whitespace-pre-line select-text font-sans shadow-inner">
              {song.lyrics}
            </div>
          ) : (
            <div className="text-center py-12 text-studio-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-35" />
              <p className="text-sm">Studio lyrics will be updated soon for this track.</p>
            </div>
          )}
        </div>

        {/* Google Drive Vault & Studio Assurance - 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          
          <Card3D maxTilt={10} scale={1.02}>
            <div className="glass-3d border border-emerald-500/30 p-7 rounded-3xl space-y-4 shadow-2xl preserve-3d">
              <div className="flex items-center justify-between depth-2">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>Google Drive Audio Cloud</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
              
              <p className="text-xs text-gray-300 leading-relaxed depth-1">
                Audio is stored directly in the official Music City Odia Google Drive storage folder for high-speed streaming and pristine sound fidelity.
              </p>

              <div className="bg-studio-dark/70 border border-studio-border rounded-xl p-4 text-xs space-y-2.5 depth-2">
                <div className="flex justify-between text-gray-400">
                  <span>Drive Folder:</span>
                  <span className="text-white font-mono font-medium">1zur8UsA...2U8m</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Storage Engine:</span>
                  <span className="text-emerald-400 font-medium">Google Drive API v3</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Download Speed:</span>
                  <span className="text-white font-medium">Full Bandwidth (No throttling)</span>
                </div>
              </div>
            </div>
          </Card3D>

          <div className="glass-3d border border-studio-border p-7 rounded-3xl space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-studio-accent" />
              <span>Purchase Guarantee</span>
            </h4>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex items-center space-x-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited 320kbps full-length studio track downloads</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Permanent lifetime access in your Studio Library dashboard</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Supports original Odia vocalists, lyricists, and producers</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
