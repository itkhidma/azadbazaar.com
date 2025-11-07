'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Cart } from '@/types';
import { 
  getCart, 
  addToCart as addToCartService,
  updateCartItemQuantity as updateQuantityService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService
} from '@/services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userCart = await getCart(user.uid);
      setCart(userCart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) throw new Error('User must be logged in');
    
    setLoading(true);
    try {
      await addToCartService(user.uid, productId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) throw new Error('User must be logged in');
    
    setLoading(true);
    try {
      await updateQuantityService(user.uid, productId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) throw new Error('User must be logged in');
    
    setLoading(true);
    try {
      await removeFromCartService(user.uid, productId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) throw new Error('User must be logged in');
    
    setLoading(true);
    try {
      await clearCartService(user.uid);
      await fetchCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
