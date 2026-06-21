import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Song } from './AudioPlayerContext';

interface CartContextType {
  cartItems: Song[];
  addToCart: (song: Song) => void;
  removeFromCart: (songId: string) => void;
  clearCart: () => void;
  isInCart: (songId: string) => boolean;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<Song[]>([]);

  // Load cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('music_city_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // Save cart to local storage whenever it changes
  const saveCart = (items: Song[]) => {
    setCartItems(items);
    localStorage.setItem('music_city_cart', JSON.stringify(items));
  };

  const addToCart = (song: Song) => {
    if (!isInCart(song.id)) {
      saveCart([...cartItems, song]);
    }
  };

  const removeFromCart = (songId: string) => {
    saveCart(cartItems.filter(item => item.id !== songId));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const isInCart = (songId: string) => {
    return cartItems.some(item => item.id === songId);
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + Number(item.price), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
