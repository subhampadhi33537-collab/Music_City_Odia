import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Cart: React.FC = () => {
  const { cartItems, removeFromCart, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // Clean up script if exists
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCheckout = async () => {
    setError(null);
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    if (cartItems.length === 0) return;

    setCheckoutLoading(true);

    try {
      // 1. Create order on FastAPI backend
      const songIds = cartItems.map(item => item.id);
      const order = await api.orders.create(songIds);

      // 2. If it's a mock order, verify immediately to bypass payment gate in developer setup
      if (order.is_mock) {
        setTimeout(async () => {
          try {
            const verifyRes = await api.orders.verify(
              order.razorpay_order_id,
              'pay_mock_' + Math.random().toString(36).substring(7),
              'mock_signature_success'
            );
            if (verifyRes.status === 'success') {
              clearCart();
              setCheckoutLoading(false);
              navigate('/library');
            }
          } catch (err: any) {
            setError(err.message || 'Mock payment verification failed');
            setCheckoutLoading(false);
          }
        }, 1200);
        return;
      }

      // 3. Otherwise, open real Razorpay checkout widget
      const options = {
        key: order.razorpay_key_id,
        amount: Math.round(order.amount * 100), // paise
        currency: order.currency || 'INR',
        name: 'Music City Odia',
        description: `Buying ${cartItems.length} studio track(s)`,
        order_id: order.razorpay_order_id,
        handler: async function (response: any) {
          try {
            setCheckoutLoading(true);
            const verifyRes = await api.orders.verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (verifyRes.status === 'success') {
              clearCart();
              navigate('/library');
            }
          } catch (err: any) {
            setError(err.message || 'Payment signature verification failed.');
          } finally {
            setCheckoutLoading(false);
          }
        },
        prefill: {
          name: profile?.full_name || '',
          email: user.email || '',
          contact: profile?.phone || ''
        },
        theme: {
          color: '#F97316' // hot orange accent
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setError(err.message || 'Failed to start payment checkout.');
      setCheckoutLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-studio-border rounded-full flex items-center justify-center text-studio-muted">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Explore our song catalog to purchase full-quality audio sound tracks.
        </p>
        <Link to="/songs" className="bg-studio-accent text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-studio-accent/90 transition-colors">
          Browse Songs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Shopping Cart</h1>
        <p className="text-studio-muted text-sm mt-1">Review selected songs and complete your payment.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Items List - 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((song) => (
            <div
              key={song.id}
              className="bg-studio-card border border-studio-border p-4 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <img
                  src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150'}
                  alt={song.title}
                  className="w-14 h-14 rounded object-cover border border-studio-border shrink-0"
                />
                <div className="min-w-0">
                  <Link to={`/songs/${song.id}`} className="font-bold text-white hover:text-studio-accent transition-colors truncate block">
                    {song.title}
                  </Link>
                  <p className="text-xs text-studio-muted truncate">{song.artist}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0">
                <span className="text-studio-gold font-bold">₹{song.price}</span>
                <button
                  onClick={() => removeFromCart(song.id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-studio-border rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary - 4 cols */}
        <div className="lg:col-span-4 bg-studio-card border border-studio-border p-6 rounded-xl space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-studio-border pb-3">Order Summary</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Items Count</span>
              <span className="text-white font-medium">{cartItems.length}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Format</span>
              <span className="text-white font-medium">HQ MP3 (320kbps)</span>
            </div>
            
            <div className="border-t border-studio-border pt-3 flex justify-between font-bold text-base">
              <span className="text-white">Total Amount</span>
              <span className="text-studio-gold">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center space-x-2 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-studio-accent/20 disabled:opacity-50"
            >
              <span>{checkoutLoading ? 'Processing Checkout...' : 'Proceed to Checkout'}</span>
              {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-studio-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Payments secured by Razorpay (SSL encrypted)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
