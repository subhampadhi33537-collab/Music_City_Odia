import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Music, Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-studio-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 glass border border-studio-border p-6 sm:p-10 rounded-2xl relative z-10 text-left">

        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-studio-accent rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Forgot Password</h2>
          <p className="text-xs text-studio-muted uppercase tracking-wider font-semibold">
            Super Bass Sound Studio
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-xl flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="font-bold text-white text-lg">Reset Link Sent!</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              We sent a password reset link to <strong className="text-gray-300">{email}</strong>.
              Check your inbox and follow the link to reset your password.
            </p>
            <Link to="/login" className="text-xs font-semibold bg-studio-accent text-white px-4 py-2 rounded-lg hover:bg-studio-accent/90 transition-colors">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 -mt-2">
              Enter your registered email address and we'll send you a password reset link.
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-studio-card border border-studio-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-studio-accent/20 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
              </button>
            </form>
          </>
        )}

        <div className="border-t border-studio-border pt-4 text-center text-xs text-studio-muted">
          <Link to="/login" className="flex items-center justify-center space-x-1 text-studio-accent hover:underline font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
