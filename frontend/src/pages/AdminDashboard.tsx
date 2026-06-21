import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { IndianRupee, Disc, UserPlus, Flame, Settings, Plus, ShoppingCart } from 'lucide-react';

interface TopSong {
  id: string;
  title: string;
  artist: string;
  sales_count: number;
  revenue: number;
}

interface Stats {
  total_revenue: number;
  total_songs_sold: number;
  recent_signups: number;
  top_selling_songs: TopSong[];
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.admin.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load administrator statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen text-left">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Admin Dashboard</h1>
          <p className="text-studio-muted text-sm mt-1">Overview of Music City Odia sales and uploads.</p>
        </div>
        
        {/* Quick actions buttons */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/songs/new"
            className="flex items-center space-x-1.5 bg-studio-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-studio-accent/90 transition-colors shadow-md shadow-studio-accent/15"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Song</span>
          </Link>
          <Link
            to="/admin/songs"
            className="flex items-center space-x-1.5 bg-studio-card border border-studio-border text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-studio-border transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Songs</span>
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center space-x-1.5 bg-studio-card border border-studio-border text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-studio-border transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sales History</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Revenue card */}
        <div className="bg-studio-card border border-studio-border p-6 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-studio-muted uppercase tracking-wider">Total Revenue</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">₹{stats?.total_revenue.toFixed(2) || '0.00'}</p>
          </div>
          <div className="w-12 h-12 bg-studio-accent/10 border border-studio-accent/20 rounded-lg flex items-center justify-center text-studio-accent">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Songs Sold card */}
        <div className="bg-studio-card border border-studio-border p-6 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-studio-muted uppercase tracking-wider">Total Songs Sold</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats?.total_songs_sold || 0}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
            <Disc className="w-6 h-6 animate-spin-slow" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        {/* Recent signups card */}
        <div className="bg-studio-card border border-studio-border p-6 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-studio-muted uppercase tracking-wider">Signups (Last 7 Days)</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats?.recent_signups || 0}</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Top Selling Table */}
      <div className="glass border border-studio-border rounded-xl p-6">
        <div className="flex items-center space-x-2 text-white mb-6">
          <Flame className="w-5 h-5 text-studio-accent fill-studio-accent" />
          <h2 className="text-lg font-bold">Top Selling Songs</h2>
        </div>

        {stats?.top_selling_songs && stats.top_selling_songs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-studio-border text-xs text-white uppercase font-bold border-b border-studio-border">
                <tr>
                  <th className="px-4 py-3">Song Details</th>
                  <th className="px-4 py-3">Artist</th>
                  <th className="px-4 py-3 text-center">Sales Count</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border">
                {stats.top_selling_songs.map((song) => (
                  <tr key={song.id} className="hover:bg-studio-border/30 transition-colors">
                    <td className="px-4 py-3 text-white font-semibold">{song.title}</td>
                    <td className="px-4 py-3">{song.artist}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-300">{song.sales_count}</td>
                    <td className="px-4 py-3 text-right text-studio-gold font-bold">₹{Number(song.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-studio-muted text-sm">
            No song sales data recorded yet.
          </div>
        )}
      </div>

    </div>
  );
};
