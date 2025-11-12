import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, Address } from '@/types';
import { clearCart } from '@/services/cartService';
import { isUserBlocked } from '@/services/customerService';

const ordersCollection = collection(db, 'orders');

// Create new order
export const createOrder = async (
  userId: string,
  items: any[],
  totalAmount: number,
  shippingAddress: Address
): Promise<string> => {
  try {
    // Check if user is blocked
    const blocked = await isUserBlocked(userId);
    if (blocked) {
      throw new Error('Your account has been blocked. You cannot place orders.');
    }

    const orderData = {
      userId,
      items,
      totalAmount,
      shippingAddress,
      paymentStatus: 'pending',
      orderStatus: 'processing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(ordersCollection, orderData);
    
    // Clear user's cart after order creation
    await clearCart(userId);
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (orderDoc.exists()) {
      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as Order;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all orders for a user
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      ordersCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Order[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update order status (Admin function)
export const updateOrderStatus = async (
  orderId: string,
  orderStatus: Order['orderStatus']
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      orderStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update payment status
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: Order['paymentStatus']
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all orders (Admin function)
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Order[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};
