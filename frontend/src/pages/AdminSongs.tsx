import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Star, CheckCircle2, XCircle } from 'lucide-react';

export const AdminSongs: React.FC = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // Update state local
      setSongs(songs.map(song => song.id === id ? { ...song, [key]: !currentValue } : song));
    } catch (err: any) {
      alert('Failed to update song status: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this song and all its associated audio/image files from storage?')) {
      return;
    }
    
    try {
      await api.admin.deleteSong(id);
      setSongs(songs.filter(song => song.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
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
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Manage Songs</h1>
          <p className="text-studio-muted text-sm mt-1">Publish, feature, or delete audio tracks.</p>
        </div>
        <Link
          to="/admin/songs/new"
          className="flex items-center space-x-1 bg-studio-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-studio-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Song</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Songs Table */}
      <div className="glass border border-studio-border rounded-xl overflow-hidden">
        {songs.length === 0 ? (
          <div className="text-center py-16 text-studio-muted">
            No songs uploaded in inventory yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-studio-border text-xs text-white uppercase font-bold border-b border-studio-border">
                <tr>
                  <th className="px-6 py-3">Song Info</th>
                  <th className="px-6 py-3">Genre</th>
                  <th className="px-6 py-3 text-center">Price</th>
                  <th className="px-6 py-3 text-center">Featured</th>
                  <th className="px-6 py-3 text-center">Published</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/50">
                {songs.map((song) => (
                  <tr key={song.id} className="hover:bg-studio-border/25 transition-colors">
                    {/* Artwork & details */}
                    <td className="px-6 py-4 flex items-center space-x-3 text-white font-semibold">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover border border-studio-border"
                      />
                      <div className="min-w-0">
                        <span className="truncate block">{song.title}</span>
                        <span className="text-xs text-studio-muted font-normal block">{song.artist}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-studio-gold">
                      {song.genres?.name || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-center text-white font-bold">
                      ₹{song.price}
                    </td>

                    {/* Featured toggle */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleState(song.id, 'is_featured', song.is_featured)}
                        className={`p-1.5 rounded transition-colors ${
                          song.is_featured
                            ? 'text-studio-gold hover:bg-studio-gold/10'
                            : 'text-gray-500 hover:text-white hover:bg-studio-border'
                        }`}
                        title={song.is_featured ? 'Click to Un-feature' : 'Click to Feature'}
                      >
                        <Star className={`w-5 h-5 ${song.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Published toggle */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleState(song.id, 'is_published', song.is_published)}
                        className={`p-1 rounded transition-colors ${
                          song.is_published
                            ? 'text-emerald-500 hover:bg-emerald-500/10'
                            : 'text-red-500 hover:bg-red-500/10'
                        }`}
                        title={song.is_published ? 'Click to Un-publish' : 'Click to Publish'}
                      >
                        {song.is_published ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleDelete(song.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
                          title="Delete Song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
