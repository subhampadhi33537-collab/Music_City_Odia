import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  RefreshCw,
  Mic2,
  Headphones,
  Sliders,
  Send,
  User,
  Sparkles
} from 'lucide-react';
import { Card3D } from '../components/Card3D';

interface Booking {
  id: number;
  user_id: number | null;
  name: string;
  email: string | null;
  phone: string;
  service: string;
  message: string;
  status: 'pending' | 'contacted' | 'confirmed' | 'completed' | 'cancelled' | string;
  created_at: string;
  user_full_name?: string | null;
  user_account_email?: string | null;
}

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.listBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load studio bookings and contact inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.admin.updateBookingStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      setActionMessage(`Booking #${id} status updated to "${newStatus}".`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete inquiry #${id}?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.admin.deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setActionMessage(`Inquiry #${id} removed successfully.`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking inquiry.');
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const contacted = bookings.filter((b) => b.status === 'contacted').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    return { total, pending, contacted, confirmed, completed };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        b.name?.toLowerCase().includes(query) ||
        b.phone?.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.service?.toLowerCase().includes(query) ||
        b.message?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchQuery]);

  const getServiceIcon = (service: string) => {
    const s = service?.toLowerCase() || '';
    if (s.includes('record')) return <Mic2 className="w-4 h-4 text-amber-400" />;
    if (s.includes('mix') || s.includes('master')) return <Sliders className="w-4 h-4 text-cyan-400" />;
    if (s.includes('dub')) return <Headphones className="w-4 h-4 text-emerald-400" />;
    return <Sparkles className="w-4 h-4 text-studio-accent" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Clock className="w-3.5 h-3.5" /> Contacted
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
            Cancelled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Pending Action
          </span>
        );
    }
  };

  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      
      {/* Back button & actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          to="/admin"
          className="inline-flex items-center text-gray-400 hover:text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all border border-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inquiries</span>
        </button>
      </div>

      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-studio-accent/15 text-studio-accent border border-studio-accent/30">
            <Calendar className="w-3.5 h-3.5" /> Studio Session Leads
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          Studio Bookings & Contact Leads
        </h1>
        <p className="text-studio-muted text-sm mt-1">
          Review customer session inquiries for audio recording, dubbing, mixing, and direct contacts from the website.
        </p>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── METRICS OVERVIEW BAR ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card3D maxTilt={6}>
          <div className="glass-3d p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-studio-muted">Total Inquiries</p>
              <h3 className="text-2xl font-black text-white mt-1">{metrics.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card3D>

        <Card3D maxTilt={6}>
          <div className="glass-3d p-4 rounded-xl border border-amber-500/25 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-amber-400">Needs Response</p>
              <h3 className="text-2xl font-black text-amber-300 mt-1">{metrics.pending}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </Card3D>

        <Card3D maxTilt={6}>
          <div className="glass-3d p-4 rounded-xl border border-emerald-500/25 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-emerald-400">Confirmed</p>
              <h3 className="text-2xl font-black text-emerald-300 mt-1">{metrics.confirmed}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card3D>

        <Card3D maxTilt={6}>
          <div className="glass-3d p-4 rounded-xl border border-sky-500/25 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-sky-400">Contacted / In Talk</p>
              <h3 className="text-2xl font-black text-sky-300 mt-1">{metrics.contacted}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Phone className="w-5 h-5" />
            </div>
          </div>
        </Card3D>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass p-4 rounded-2xl border border-white/10">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-studio-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, email, service..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-studio-muted focus:outline-none focus:border-studio-accent transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-studio-accent text-white shadow-md shadow-studio-accent/20'
                  : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOOKING INQUIRIES LIST ── */}
      {loading ? (
        <div className="text-center py-20">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-studio-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-studio-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-studio-muted text-sm mt-4">Loading studio booking records...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-studio-muted mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-white">No inquiries found</h3>
          <p className="text-studio-muted text-sm max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No booking inquiries matched your search or status filter criteria.'
              : 'There are currently no customer booking requests submitted yet.'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs font-bold text-studio-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="glass border border-white/10 hover:border-white/20 transition-all rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg hover:shadow-black/50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                
                {/* Left: Customer Info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-studio-accent/25 to-amber-500/10 border border-studio-accent/30 flex items-center justify-center text-studio-accent shrink-0 font-bold text-lg">
                    {b.name ? b.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white">{b.name}</h3>
                      <span className="text-xs text-studio-muted font-mono">#{b.id}</span>
                      {getStatusBadge(b.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-studio-muted mt-1">
                      <span className="flex items-center gap-1 text-gray-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-studio-muted" />
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {b.user_full_name && (
                        <span className="text-amber-400/90 font-medium">
                          Registered User: {b.user_full_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Contact Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Phone Call */}
                  {b.phone && (
                    <a
                      href={`tel:${b.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                      title="Direct Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{b.phone}</span>
                    </a>
                  )}

                  {/* WhatsApp */}
                  {b.phone && (
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(b.phone)}?text=Hello%20${encodeURIComponent(b.name)}%2C%20thank%20you%20for%20contacting%20Music%20City%20Odia%20Studio!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                      title="Chat on WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* Email */}
                  {b.email && (
                    <a
                      href={`mailto:${b.email}?subject=Music%20City%20Odia%20Studio%20Booking%20Inquiry%20%23${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="max-w-[140px] truncate">{b.email}</span>
                    </a>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all ml-1"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Service & Message Content */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                
                {/* Requested Service */}
                <div className="md:col-span-1 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-studio-muted">
                    Requested Service
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-white bg-black/30 border border-white/5 rounded-xl px-3 py-2">
                    {getServiceIcon(b.service)}
                    <span className="capitalize">{b.service || 'General Studio Inquiry'}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="md:col-span-2 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-studio-muted">
                    Customer Message & Notes
                  </span>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-sm text-gray-300 leading-relaxed min-h-[46px]">
                    {b.message ? (
                      <p className="whitespace-pre-wrap">{b.message}</p>
                    ) : (
                      <span className="text-studio-muted italic">No custom notes provided.</span>
                    )}
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="md:col-span-1 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-studio-muted">
                    Change Status
                  </span>
                  <select
                    value={b.status || 'pending'}
                    disabled={updatingId === b.id}
                    onChange={(e) => handleStatusChange(b.id, e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-studio-accent cursor-pointer transition-all"
                  >
                    <option value="pending">🟡 Pending Action</option>
                    <option value="contacted">🔵 Contacted / Calling</option>
                    <option value="confirmed">🟢 Confirmed Session</option>
                    <option value="completed">🟣 Completed Session</option>
                    <option value="cancelled">⚪ Cancelled / Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
