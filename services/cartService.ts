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
    // If user is blocked or has permission issues, return empty cart
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.warn('User blocked or permission denied, returning empty cart');
      return {
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
        updatedAt: new Date(),
      };
    }
    throw new Error(error.message);
  }
};

// Helper function to clean product data (remove undefined values)
const cleanProductForCart = (product: Product): any => {
  const cleaned: any = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    imageUrls: product.imageUrls,
    category: product.category,
    stock: product.stock,
    createdBy: product.createdBy,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  // Only add optional fields if they have actual values (not undefined)
  if (product.videoUrl) cleaned.videoUrl = product.videoUrl;
  if (product.originalPrice) cleaned.originalPrice = product.originalPrice;
  if (product.isOnFlashSale !== undefined) cleaned.isOnFlashSale = product.isOnFlashSale;
  if (product.flashSaleEndDate) cleaned.flashSaleEndDate = product.flashSaleEndDate;
  if (product.flashSaleDiscountPercentage) cleaned.flashSaleDiscountPercentage = product.flashSaleDiscountPercentage;
  if (product.flashSaleSoldCount !== undefined) cleaned.flashSaleSoldCount = product.flashSaleSoldCount;
  if (product.flashSaleStockLimit) cleaned.flashSaleStockLimit = product.flashSaleStockLimit;
  if (product.salesCount !== undefined) cleaned.salesCount = product.salesCount;
  if (product.isFeatured !== undefined) cleaned.isFeatured = product.isFeatured;

  return cleaned;
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
      // Add new item - clean product data to remove undefined values
      updatedItems = [
        ...cart.items,
        {
          productId,
          quantity,
          product: cleanProductForCart(product),
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
    // If user is blocked, show appropriate message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error('Your account has been blocked. You cannot add items to cart.');
    }
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
    // If user is blocked, show appropriate message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error('Your account has been blocked. You cannot update cart.');
    }
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
    // If user is blocked, silently fail or show message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.warn('User blocked, cannot remove from cart');
      return;
    }
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
