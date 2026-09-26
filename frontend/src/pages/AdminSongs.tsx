import React, { useEffect, useState } from 'react';
import { api, type SongRecord } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  HardDrive,
  ExternalLink,
  FileText,
  Play,
  Pause,
  Disc
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

export const AdminSongs: React.FC = () => {
  const [songs, setSongs] = useState<SongRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { play, currentSong, isPlaying, togglePlay } = useAudioPlayer();

  const loadSongs = async () => {
    setLoading(true);
    try {
      const data = await api.admin.listSongs();
      setSongs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load songs inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleToggleState = async (id: string, key: 'is_published' | 'is_featured', currentValue: boolean) => {
    try {
      await api.admin.updateSong(id, { [key]: !currentValue });
      setSongs(songs.map(song => song.id === id ? { ...song, [key]: !currentValue } : song));
    } catch (err: any) {
      alert('Failed to update song status: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this song and its Google Drive reference?')) {
      return;
    }
    
    try {
      await api.admin.deleteSong(id);
      setSongs(songs.filter(song => song.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handlePlaySong = (song: SongRecord) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      play({
        id: song.id,
        title: song.title,
        artist: song.artist,
        preview_url: song.preview_url,
        cover_url: song.cover_url,
        price: song.price,
      }, true);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      
      {/* Header with 3D tactile actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2.5">
            <Disc className="w-8 h-8 text-studio-accent animate-spin-slow" style={{ animationDuration: '10s' }} />
            Manage Studio Songs
          </h1>
          <p className="text-studio-muted text-sm mt-1">
            Google Drive audio storage, master song metadata, lyrics repository, and commercial inventory.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://drive.google.com/drive/folders/1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d-secondary flex items-center space-x-2 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            <HardDrive className="w-4 h-4" />
            <span>Open Drive Folder</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </a>
          <Link
            to="/admin/songs/new"
            className="btn-3d flex items-center space-x-2 bg-studio-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Song</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Songs Table with 3D Glass Styling */}
      <div className="glass-3d border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {songs.length === 0 ? (
          <div className="text-center py-24 text-studio-muted">
            <Disc className="w-14 h-14 text-white/20 mx-auto mb-3 animate-spin-slow" />
            <p className="text-lg font-bold text-gray-200">No songs uploaded in inventory yet.</p>
            <p className="text-xs text-studio-muted mt-1">Click 'Upload Song' above to add your first studio track to Google Drive.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.04] text-xs text-white uppercase font-bold border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Track & Artist</th>
                  <th className="px-6 py-3.5">Album / Genre</th>
                  <th className="px-6 py-3.5 text-center">Drive Storage</th>
                  <th className="px-6 py-3.5 text-center">Price</th>
                  <th className="px-6 py-3.5 text-center">Featured</th>
                  <th className="px-6 py-3.5 text-center">Published</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/40">
                {songs.map((song) => {
                  const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
                  return (
                    <tr key={song.id} className="hover:bg-studio-border/20 transition-colors">
                      {/* Artwork & details */}
                      <td className="px-6 py-4 flex items-center space-x-3 text-white font-semibold">
                        <div className="relative group shrink-0">
                          <img
                            src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}
                            alt={song.title}
                            className="w-11 h-11 rounded-lg object-cover border border-studio-border"
                          />
                          <button
                            onClick={() => handlePlaySong(song)}
                            className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-4 h-4 fill-white text-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            )}
                          </button>
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block font-bold text-white hover:text-studio-accent transition-colors">
                            {song.title}
                          </span>
                          <span className="text-xs text-studio-muted font-normal block">{song.artist}</span>
                        </div>
                      </td>

                      {/* Album & Genre */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-gray-200">
                          {song.album || 'Single Track'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase font-bold text-studio-gold">
                            {song.genres?.name || 'Odia Song'}
                          </span>
                          {song.lyrics && (
                            <span className="inline-flex items-center text-[10px] bg-studio-accent/10 text-studio-accent border border-studio-accent/20 px-1.5 py-0.2 rounded font-medium">
                              <FileText className="w-2.5 h-2.5 mr-0.5" /> Lyrics
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Google Drive Status Link */}
                      <td className="px-6 py-4 text-center">
                        {song.drive_web_link ? (
                          <a
                            href={song.drive_web_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md hover:bg-emerald-500/20 transition-colors"
                            title="Open Google Drive File"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>Drive File</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-studio-muted">No Drive Link</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-center font-bold text-white">
                        {song.price === 0 ? (
                          <span className="text-emerald-400 text-xs uppercase">Free</span>
                        ) : (
                          <span>₹{song.price}</span>
                        )}
                      </td>

                      {/* Featured */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleState(song.id, 'is_featured', !!song.is_featured)}
                          className="hover:scale-110 transition-transform"
                          title="Toggle Featured"
                        >
                          <Star className={`w-5 h-5 mx-auto ${song.is_featured ? 'text-studio-gold fill-studio-gold' : 'text-gray-600'}`} />
                        </button>
                      </td>

                      {/* Published */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleState(song.id, 'is_published', !!song.is_published)}
                          className="hover:scale-110 transition-transform"
                          title="Toggle Published Status"
                        >
                          {song.is_published ? (
                            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 mx-auto text-red-400" />
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleDelete(song.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
