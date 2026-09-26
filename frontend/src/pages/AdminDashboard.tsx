import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Disc,
  UserPlus,
  Flame,
  Settings,
  Plus,
  ShoppingCart,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  Radio,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Card3D } from '../components/Card3D';
import logoImg from '../assets/logo.png';

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
  total_bookings?: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [driveStatus, setDriveStatus] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [statsData, driveData, bookingsData] = await Promise.allSettled([
          api.admin.getStats(),
          api.admin.getDriveStatus(),
          api.admin.listBookings(),
        ]);
        
        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        } else {
          setError('Failed to load administrator statistics.');
        }

        if (driveData.status === 'fulfilled') {
          setDriveStatus(driveData.value);
        }

        if (bookingsData.status === 'fulfilled') {
          setRecentBookings(bookingsData.value || []);
        }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-start gap-5">
          {/* Official Logo in Admin */}
          <div
            className="w-14 h-14 rounded-full overflow-hidden border-2 border-studio-accent/40 shrink-0"
            style={{ boxShadow: '0 0 0 3px rgba(249,115,22,0.15), 0 4px 20px rgba(249,115,22,0.25)' }}
          >
            <img src={logoImg} alt="Music City Odia" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <ShieldCheck className="w-3.5 h-3.5" /> Studio Admin Deck
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Admin Dashboard</h1>
            <p className="text-studio-muted text-sm mt-1">
              Studio audio inventory, Google Drive cloud storage, and commercial telemetry.
            </p>
          </div>
        </div>
        
        {/* Quick actions buttons with 3D tactile push styling */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/songs/new"
            className="btn-3d flex items-center space-x-2 bg-studio-accent text-white px-4 py-2.5 rounded-xl text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Song</span>
          </Link>
          <Link
            to="/admin/songs"
            className="btn-3d-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-200"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Songs</span>
          </Link>
          <Link
            to="/admin/orders"
            className="btn-3d-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-200"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sales History</span>
          </Link>
          <Link
            to="/admin/bookings"
            className="btn-3d-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-amber-300 border border-amber-500/30 hover:bg-amber-500/10"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Bookings & Leads</span>
            {recentBookings.filter((b) => b.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black">
                {recentBookings.filter((b) => b.status === 'pending').length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Google Drive Status Banner Card */}
      <Card3D maxTilt={6} className="w-full">
        <div className="glass-3d glow-border-emerald p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Google Drive Audio Vault</h3>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" /> {driveStatus?.folder_name || 'Active Storage'}
                </span>
              </div>
              <p className="text-xs text-studio-muted mt-0.5">
                Target Folder ID: <code className="text-emerald-300 font-mono">{driveStatus?.folder_id || '1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m'}</code>
              </p>
            </div>
          </div>

          <a
            href="https://drive.google.com/drive/folders/1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d-emerald text-xs font-bold text-white px-4 py-2.5 rounded-xl inline-flex items-center space-x-2 shrink-0 self-start sm:self-auto"
          >
            <span>Browse Drive Files</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </Card3D>

      {/* 3D Interactive Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue card with 3D tilt */}
        <Card3D maxTilt={10}>
          <div className="glass-3d glow-border-accent p-6 rounded-2xl flex items-center justify-between gap-4 h-full">
            <div className="space-y-1">
              <span className="text-xs font-bold text-studio-muted uppercase tracking-wider">Total Revenue</span>
              <p className="text-3xl sm:text-4xl font-black text-white">₹{stats?.total_revenue?.toFixed(2) || '0.00'}</p>
              <p className="text-[11px] text-studio-accent font-semibold">Store Gross Earnings</p>
            </div>
            <div className="w-13 h-13 bg-studio-accent/15 border border-studio-accent/30 rounded-2xl flex items-center justify-center text-studio-accent shadow-lg shadow-studio-accent/20">
              <IndianRupee className="w-7 h-7" />
            </div>
          </div>
        </Card3D>

        {/* Songs Sold card with 3D tilt */}
        <Card3D maxTilt={10}>
          <div className="glass-3d glow-border-emerald p-6 rounded-2xl flex items-center justify-between gap-4 h-full">
            <div className="space-y-1">
              <span className="text-xs font-bold text-studio-muted uppercase tracking-wider">Total Songs Sold</span>
              <p className="text-3xl sm:text-4xl font-black text-white">{stats?.total_songs_sold || 0}</p>
              <p className="text-[11px] text-emerald-400 font-semibold">Licensed Odia Tracks</p>
            </div>
            <div className="w-13 h-13 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Disc className="w-7 h-7 animate-spin-slow" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </Card3D>

        {/* Studio Bookings card with 3D tilt */}
        <Link to="/admin/bookings" className="block h-full">
          <Card3D maxTilt={10}>
            <div className="glass-3d p-6 rounded-2xl flex items-center justify-between gap-4 h-full border border-amber-500/25 hover:border-amber-500/50 transition-all">
              <div className="space-y-1">
                <span className="text-xs font-bold text-studio-muted uppercase tracking-wider">Studio Bookings</span>
                <p className="text-3xl sm:text-4xl font-black text-amber-300">
                  {stats?.total_bookings || recentBookings.length || 0}
                </p>
                <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                  <span>Manage Leads</span>
                  <ArrowRight className="w-3 h-3" />
                </p>
              </div>
              <div className="w-13 h-13 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                <Calendar className="w-7 h-7" />
              </div>
            </div>
          </Card3D>
        </Link>

        {/* Recent signups card with 3D tilt */}
        <Card3D maxTilt={10}>
          <div className="glass-3d p-6 rounded-2xl flex items-center justify-between gap-4 h-full">
            <div className="space-y-1">
              <span className="text-xs font-bold text-studio-muted uppercase tracking-wider">Signups (Last 7 Days)</span>
              <p className="text-3xl sm:text-4xl font-black text-white">{stats?.recent_signups || 0}</p>
              <p className="text-[11px] text-sky-400 font-semibold">New Audience Accounts</p>
            </div>
            <div className="w-13 h-13 bg-sky-500/15 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
              <UserPlus className="w-7 h-7" />
            </div>
          </div>
        </Card3D>

      </div>

      {/* Recent Studio Bookings & Contact Requests */}
      <div className="glass-3d border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5 text-white">
            <Calendar className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold">Recent Studio Inquiries & Contact Leads</h2>
              <p className="text-xs text-studio-muted">Customer requests for recording, dubbing, mixing, and studio sessions.</p>
            </div>
          </div>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>View All ({recentBookings.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.04] text-xs text-white uppercase font-bold border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentBookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-white font-bold block">{booking.name}</span>
                      <span className="text-[11px] text-studio-muted block truncate max-w-[200px]">
                        {booking.message || 'No notes'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-300">
                      <div>{booking.phone}</div>
                      {booking.email && <div className="text-[10px] text-studio-muted">{booking.email}</div>}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold capitalize text-amber-300">
                      {booking.service || 'Studio Session'}
                    </td>
                    <td className="px-5 py-4 text-xs text-studio-muted">
                      {new Date(booking.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : booking.status === 'contacted'
                            ? 'bg-sky-500/20 text-sky-400'
                            : booking.status === 'completed'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {booking.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/admin/bookings"
                        className="text-xs font-bold text-studio-accent hover:underline inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-studio-muted text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-white/20" />
            No customer inquiries yet.
          </div>
        )}
      </div>

      {/* Top Selling Table with 3D Card wrapper */}
      <div className="glass-3d border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center space-x-2.5 text-white mb-6">
          <Flame className="w-6 h-6 text-studio-accent fill-studio-accent" />
          <h2 className="text-xl font-bold">Top Selling Studio Tracks</h2>
        </div>

        {stats?.top_selling_songs && stats.top_selling_songs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.04] text-xs text-white uppercase font-bold border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Song Details</th>
                  <th className="px-5 py-3.5">Artist</th>
                  <th className="px-5 py-3.5 text-center">Sales Count</th>
                  <th className="px-5 py-3.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.top_selling_songs.map((song) => (
                  <tr key={song.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4 text-white font-bold">{song.title}</td>
                    <td className="px-5 py-4">{song.artist}</td>
                    <td className="px-5 py-4 text-center font-extrabold text-white">{song.sales_count}</td>
                    <td className="px-5 py-4 text-right text-studio-gold font-bold">₹{Number(song.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-studio-muted text-sm">
            <Disc className="w-10 h-10 mx-auto mb-2 text-white/20 animate-spin-slow" />
            No song sales data recorded yet.
          </div>
        )}
      </div>

    </div>
  );
};
