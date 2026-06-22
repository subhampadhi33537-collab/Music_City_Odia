import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_admin: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (token: string) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (token: string): Promise<Profile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('sb-token', token);
    const p = await fetchProfile(token);
    setProfile(p);
  };

  const signOut = () => {
    localStorage.removeItem('sb-token');
    setProfile(null);
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('sb-token');
    if (token) {
      const p = await fetchProfile(token);
      setProfile(p);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sb-token');
      if (token) {
        const p = await fetchProfile(token);
        setProfile(p);
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchProfile]);

  const isAdmin = profile?.is_admin || false;

  return (
    <AuthContext.Provider value={{
      user: profile, // Use profile as user for compatibility
      profile,
      loading,
      isAdmin,
      login,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
