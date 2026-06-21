import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Song } from '../context/AudioPlayerContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Play, Pause, Download, Music, AlertCircle } from 'lucide-react';

export const Library: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { play, currentSong, isPlaying, togglePlay } = useAudioPlayer();

  const loadPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.orders.listPurchases();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchased music library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const handlePlayFull = (songData: any) => {
    const song: Song = {
      id: songData.id,
      title: songData.title,
      artist: songData.artist,
      cover_url: songData.cover_url,
      preview_url: songData.preview_url,
      price: Number(songData.price)
    };

    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      play(song, false); // Play FULL track (private bucket signed URL)
    }
  };

  const handleDownload = async (songId: string, title: string) => {
    setDownloadingId(songId);
    try {
      const data = await api.songs.getDownloadUrl(songId);
      
      // Open signed URL in a new window/tab to trigger secure download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.target = '_blank';
      link.setAttribute('download', `${title}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Error fetching secure download link: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">My Library</h1>
        <p className="text-studio-muted text-sm mt-1">Stream full quality studio mixes or download them for offline use.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-studio-card border border-studio-border h-24 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-20 bg-studio-card/30 border border-studio-border rounded-2xl">
          <Music className="w-12 h-12 text-studio-muted mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No purchased songs</h3>
          <p className="text-sm text-studio-muted mt-1">Your purchased tracks will show up here for streaming and download.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {purchases.map((purchase) => {
            const song = purchase.song;
            if (!song) return null;
            
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            
            return (
              <div
                key={purchase.id}
                className="bg-studio-card border border-studio-border hover:border-studio-accent/20 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300"
              >
                {/* Info Block */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <img
                    src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150'}
                    alt={song.title}
                    className="w-14 h-14 rounded object-cover border border-studio-border shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate text-base">{song.title}</h3>
                    <p className="text-xs text-studio-muted truncate">{song.artist}</p>
                    <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 inline-block mt-1">
                      Purchased
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Play full track */}
                  <button
                    onClick={() => handlePlayFull(song)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCurrentPlaying
                        ? 'bg-studio-accent text-white hover:bg-studio-accent/90'
                        : 'bg-studio-border border border-studio-border text-white hover:border-studio-accent/40'
                    }`}
                    title={isCurrentPlaying ? 'Pause' : 'Stream full song'}
                  >
                    {isCurrentPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>

                  {/* Download full track */}
                  <button
                    onClick={() => handleDownload(song.id, song.title)}
                    disabled={downloadingId === song.id}
                    className="w-10 h-10 rounded-full bg-studio-border border border-studio-border text-gray-400 hover:text-white hover:border-studio-accent/40 flex items-center justify-center transition-all disabled:opacity-50"
                    title="Download audio file"
                  >
                    <Download className={`w-4 h-4 ${downloadingId === song.id ? 'animate-bounce text-studio-accent' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
