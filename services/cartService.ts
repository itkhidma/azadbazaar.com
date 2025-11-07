import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Cart, CartItem, Product } from '@/types';
import { getProductById } from './productService';

// Get user's cart
export const getCart = async (userId: string): Promise<Cart> => {
  try {
    const cartDoc = await getDoc(doc(db, 'carts', userId));
    
    if (cartDoc.exists()) {
      const data = cartDoc.data();
      return {
        userId: data.userId,
        items: data.items || [],
        totalAmount: data.totalAmount || 0,
        totalItems: data.totalItems || 0,
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as Cart;
    }
    
    // Return empty cart if doesn't exist
    return {
      userId,
      items: [],
      totalAmount: 0,
      totalItems: 0,
      updatedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Add item to cart
export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<void> => {
  try {
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');

    const cart = await getCart(userId);
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      updatedItems = [...cart.items];
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      updatedItems = [
        ...cart.items,
        {
          productId,
          quantity,
          product,
        },
      ];
    }

    // Calculate totals
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalItems = updatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Update cart in Firestore
    await setDoc(doc(db, 'carts', userId), {
      userId,
      items: updatedItems,
      totalAmount,
      totalItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<void> => {
  try {
    if (quantity <= 0) {
      await removeFromCart(userId, productId);
      return;
    }

    const cart = await getCart(userId);
    const updatedItems = cart.items.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );

    // Calculate totals
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalItems = updatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    await setDoc(doc(db, 'carts', userId), {
      userId,
      items: updatedItems,
      totalAmount,
      totalItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Remove item from cart
export const removeFromCart = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const cart = await getCart(userId);
    const updatedItems = cart.items.filter(
      item => item.productId !== productId
    );

    // Calculate totals
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalItems = updatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    await setDoc(doc(db, 'carts', userId), {
      userId,
      items: updatedItems,
      totalAmount,
      totalItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Clear entire cart
export const clearCart = async (userId: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'carts', userId), {
      userId,
      items: [],
      totalAmount: 0,
      totalItems: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};
