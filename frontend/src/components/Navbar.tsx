import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, Menu, X, ShieldAlert, Disc3 } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Navbar: React.FC = () => {
  const { user, isAdmin, signOut, profile } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3.5 py-2 text-sm font-semibold transition-all duration-200 rounded-lg group ${
      isActive
        ? 'text-studio-accent'
        : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  const depthTranslate = Math.min(scrollY * 0.03, 3);

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'linear-gradient(180deg, rgba(4,4,12,0.97) 0%, rgba(7,7,18,0.95) 100%)'
          : 'linear-gradient(180deg, rgba(4,4,12,0.80) 0%, rgba(7,7,18,0.65) 100%)',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderBottom: scrolled
          ? '1px solid rgba(249,115,22,0.18)'
          : '1px solid rgba(255,255,255,0.05)',
        boxShadow: scrolled
          ? '0 8px 40px -8px rgba(0,0,0,0.9), 0 0 60px rgba(249,115,22,0.06)'
          : '0 4px 20px -4px rgba(0,0,0,0.5)',
        transform: `perspective(1000px) translateZ(${depthTranslate}px)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── OFFICIAL LOGO ── */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div
              className="relative w-12 h-12 rounded-full overflow-hidden bg-black border-2 border-studio-accent/40 shrink-0 shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
              style={{ transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)' }}
            >
              <img
                src={logoImg}
                alt="Music City Odia Logo"
                className="w-full h-full object-cover logo-navbar"
              />
              {/* Rim light */}
              <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
                Music City{' '}
                <span className="text-gradient-fire">Odia</span>
              </span>
              <span className="text-[9px] text-studio-muted block uppercase tracking-widest font-bold -mt-0.5">
                Super Bass Studio
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Pills ── */}
          <div className="hidden md:flex items-center space-x-1 bg-white/[0.025] border border-white/5 px-2 py-1.5 rounded-full backdrop-blur-xl shadow-inner">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/songs" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5" />
                Songs
              </span>
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="flex items-center gap-1 text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Admin
                </span>
              </NavLink>
            )}
          </div>

          {/* ── Right Actions ── */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 text-gray-300 hover:text-white bg-white/[0.04] border border-white/8 rounded-xl hover:border-studio-accent/40 transition-all hover:scale-105 hover:shadow-[0_0_16px_rgba(249,115,22,0.2)]"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-studio-accent text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-studio-accent/50 animate-pulse">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/library"
                  className="btn-3d-secondary text-xs font-bold text-gray-200 px-3.5 py-2 rounded-xl"
                >
                  My Library
                </Link>
                <div className="h-5 w-px bg-white/10" />
                <Link to="/account" className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-studio-accent/20 border border-studio-accent/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-studio-accent" />
                  </div>
                  <span className="text-xs font-semibold max-w-[100px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="btn-3d-secondary text-xs font-bold text-gray-200 px-4 py-2 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-3d bg-studio-accent text-xs font-bold text-white px-4 py-2 rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Menu Toggle ── */}
          <div className="md:hidden flex items-center space-x-2">
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-studio-accent transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-studio-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-all"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {isOpen && (
        <div className="md:hidden glass border-t border-white/8 px-3 pt-3 pb-5 space-y-1">
          {[
            { to: '/', label: 'Home' },
            { to: '/songs', label: 'Songs' },
            { to: '/about', label: 'About' },
            { to: '/contact', label: 'Contact' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/6 transition-all"
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-all"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="border-t border-white/8 my-2 pt-2">
            {user ? (
              <>
                <Link to="/library" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/6 transition-all">My Library</Link>
                <Link to="/account" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/6 transition-all">Account</Link>
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="w-full text-left flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1 pt-1">
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-3d-secondary text-center py-2.5 rounded-xl text-sm font-semibold text-gray-200">Sign In</Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="btn-3d bg-studio-accent text-center py-2.5 rounded-xl text-sm font-semibold text-white">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
