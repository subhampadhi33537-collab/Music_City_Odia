import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithRetry } from '../services/api';
import { Mail, Lock, LogIn, AlertCircle, Disc3, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetchWithRetry(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        setError(err.detail || 'Invalid email or password');
        return;
      }
      const data = await response.json();
      if (data.access_token) await login(data.access_token);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Cinematic background lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-studio-accent/8 rounded-full blur-[150px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-studio-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-emerald-500/4 rounded-full blur-[100px]" />
        {/* Perspective grid */}
        <div className="absolute bottom-0 left-0 right-0 h-64 audio-grid-perspective opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 3D Card Container */}
        <div
          className="glass-deep border border-studio-accent/15 p-8 sm:p-10 rounded-3xl text-left shimmer-overlay"
          style={{
            boxShadow: '0 40px 80px -20px rgba(0,0,0,1), 0 0 60px rgba(249,115,22,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* ── Official Logo ── */}
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden border-3 border-studio-accent/40 shadow-2xl"
              style={{ boxShadow: '0 0 0 4px rgba(249,115,22,0.2), 0 12px 40px rgba(249,115,22,0.3), 0 0 80px rgba(249,115,22,0.1)' }}
            >
              <img src={logoImg} alt="Music City Odia" className="w-full h-full object-cover logo-img" />
              <div className="absolute inset-0 rounded-full border-2 border-white/15 pointer-events-none" />
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-black text-white">
                Sign <span className="text-gradient-fire">In</span>
              </h1>
              <p className="text-xs text-studio-muted uppercase tracking-widest font-bold mt-1.5 flex items-center justify-center gap-2">
                <Disc3 className="w-3 h-3 text-studio-accent animate-spin-slow" style={{ animationDuration: '6s' }} />
                Super Bass Sound Studio
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3.5 rounded-xl flex items-start space-x-2.5 text-sm mb-5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-studio-accent/60 focus:bg-white/[0.06] transition-all inset-3d"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-studio-accent hover:text-studio-gold transition-colors font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-studio-accent/60 focus:bg-white/[0.06] transition-all inset-3d"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-3d w-full bg-studio-accent text-white font-extrabold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 text-sm mt-2 ripple-3d"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Connecting...' : 'Sign In to Studio'}</span>
            </button>
          </form>

          <div className="border-t border-white/8 pt-5 mt-6 text-center text-sm text-studio-muted">
            <span>Don't have a profile? </span>
            <Link to="/signup" className="text-studio-accent hover:text-studio-gold font-bold transition-colors">
              Register Here →
            </Link>
          </div>
        </div>

        {/* Below card info */}
        <p className="text-center text-xs text-gray-600 mt-5">
          Protected by Music City Odia Studio Security
        </p>
      </div>
    </div>
  );
};
