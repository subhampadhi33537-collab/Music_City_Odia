import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { User, Phone, Mail, Save, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Account: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError(null);
    setSuccess(false);
    setSaveLoading(true);

    try {
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone
        })
        .eq('id', user.id);

      if (dbErr) {
        setError(dbErr.message);
      } else {
        await refreshProfile();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred saving changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Account Profile</h1>
        <p className="text-studio-muted text-sm mt-1">Manage your customer credentials and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Card - 4 cols */}
        <div className="lg:col-span-4 bg-studio-card border border-studio-border p-6 rounded-xl flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-studio-border border border-studio-border rounded-full flex items-center justify-center text-studio-accent text-3xl font-extrabold shadow-inner">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{profile?.full_name || 'Music City Customer'}</h3>
            <p className="text-xs text-studio-gold font-semibold uppercase tracking-wider mt-0.5">
              {profile?.is_admin ? 'Studio Admin' : 'Customer Profile'}
            </p>
          </div>

          <div className="w-full border-t border-studio-border pt-4 text-xs text-studio-muted text-left space-y-1.5">
            <p>Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
            <p className="break-all">Email: {user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-studio-border border border-studio-border hover:border-red-500/20 text-red-400 font-bold py-2.5 rounded-lg hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Right Side: Edit Form - 8 cols */}
        <div className="lg:col-span-8 glass border border-studio-border p-6 sm:p-8 rounded-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start space-x-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-start space-x-2 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Subham Das"
                  className="w-full bg-studio-card border border-studio-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919937987978"
                  className="w-full bg-studio-card border border-studio-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Email Address (Locked)</label>
              <div className="relative opacity-60">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full bg-studio-border border border-studio-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-studio-accent/25 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
