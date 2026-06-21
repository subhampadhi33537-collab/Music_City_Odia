import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Music, ShoppingCart, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, signOut, profile } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive ? 'text-studio-accent' : 'text-gray-300 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-studio-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative w-9 h-9 bg-studio-accent rounded-lg flex items-center justify-center overflow-hidden">
              <Music className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              {/* Pulsing decoration */}
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-lg transition-transform duration-300"></div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white block">
                Music City <span className="text-studio-accent">Odia</span>
              </span>
              <span className="text-[10px] text-studio-muted -mt-1 block uppercase tracking-wider font-semibold">
                Super Bass Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/songs" className={navLinkClass}>Songs</NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="flex items-center text-amber-400 font-semibold">
                  <ShieldAlert className="w-4 h-4 mr-1" />
                  Admin
                </span>
              </NavLink>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-studio-accent transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-studio-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/library" className="text-sm font-medium text-gray-300 hover:text-white transition-colors bg-studio-border/50 border border-studio-border px-3 py-1.5 rounded-lg hover:border-studio-accent/40">
                  My Library
                </Link>
                <div className="h-6 w-px bg-studio-border"></div>
                <Link to="/account" className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="text-sm font-medium text-white bg-studio-accent px-4 py-2 rounded-lg hover:bg-studio-accent/90 transition-colors shadow-lg shadow-studio-accent/20">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-studio-accent transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-studio-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-studio-card transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-studio-border px-2 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-studio-border"
          >
            Home
          </Link>
          <Link
            to="/songs"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-studio-border"
          >
            Songs
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-studio-border"
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-studio-border"
          >
            Contact
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-studio-border"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="border-t border-studio-border my-2 pt-2"></div>

          {user ? (
            <>
              <Link
                to="/library"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-studio-border"
              >
                My Library
              </Link>
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-studio-border"
              >
                Account Profile
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-studio-border"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 px-3 pt-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center py-2 border border-studio-border rounded-lg text-sm font-medium text-gray-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="text-center py-2 bg-studio-accent rounded-lg text-sm font-medium text-white hover:bg-studio-accent/90"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
