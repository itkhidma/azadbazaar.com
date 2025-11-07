import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FlashSale } from '@/types';

const flashSalesCollection = collection(db, 'flashSales');

// Get all active flash sales (within date range and active flag)
export const getActiveFlashSales = async (): Promise<FlashSale[]> => {
  try {
    const now = new Date();
    const q = query(
      flashSalesCollection,
      where('isActive', '==', true),
      where('endDate', '>', Timestamp.fromDate(now)),
      orderBy('endDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    const flashSales = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: (doc.data().startDate as Timestamp).toDate(),
        endDate: (doc.data().endDate as Timestamp).toDate(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as FlashSale[];
    
    // Filter by start date in memory (Firestore doesn't support multiple range queries)
    return flashSales.filter(sale => sale.startDate <= now && sale.soldCount < sale.stockLimit);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all flash sales (for admin)
export const getAllFlashSales = async (): Promise<FlashSale[]> => {
  try {
    const q = query(flashSalesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: (doc.data().startDate as Timestamp).toDate(),
      endDate: (doc.data().endDate as Timestamp).toDate(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as FlashSale[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get flash sale by ID
export const getFlashSaleById = async (id: string): Promise<FlashSale | null> => {
  try {
    const docRef = doc(db, 'flashSales', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as FlashSale;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get flash sale by product ID
export const getFlashSaleByProductId = async (productId: string): Promise<FlashSale | null> => {
  try {
    const now = new Date();
    const q = query(
      flashSalesCollection,
      where('productId', '==', productId),
      where('isActive', '==', true),
      where('endDate', '>', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    const flashSale = {
      id: doc.id,
      ...data,
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as FlashSale;
    
    // Check if sale has started and not sold out
    if (flashSale.startDate <= now && flashSale.soldCount < flashSale.stockLimit) {
      return flashSale;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Add new flash sale (Admin function)
export const addFlashSale = async (flashSaleData: Omit<FlashSale, 'id' | 'createdAt' | 'updatedAt' | 'soldCount'>): Promise<string> => {
  try {
    const docRef = await addDoc(flashSalesCollection, {
      ...flashSaleData,
      startDate: Timestamp.fromDate(flashSaleData.startDate),
      endDate: Timestamp.fromDate(flashSaleData.endDate),
      soldCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update flash sale (Admin function)
export const updateFlashSale = async (
  id: string, 
  flashSaleData: Partial<Omit<FlashSale, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'flashSales', id);
    const updateData: any = {
      ...flashSaleData,
      updatedAt: serverTimestamp(),
    };
    
    // Convert dates if provided
    if (flashSaleData.startDate) {
      updateData.startDate = Timestamp.fromDate(flashSaleData.startDate);
    }
    if (flashSaleData.endDate) {
      updateData.endDate = Timestamp.fromDate(flashSaleData.endDate);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Increment sold count when a flash sale product is purchased
export const incrementFlashSaleSold = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'flashSales', id);
    await updateDoc(docRef, {
      soldCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete flash sale (Admin function)
export const deleteFlashSale = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'flashSales', id));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Helper: Check if a flash sale is currently active
export const isFlashSaleActive = (flashSale: FlashSale): boolean => {
  const now = new Date();
  return (
    flashSale.isActive &&
    flashSale.startDate <= now &&
    flashSale.endDate > now &&
    flashSale.soldCount < flashSale.stockLimit
  );
};

// Helper: Calculate remaining stock
export const getRemainingStock = (flashSale: FlashSale): number => {
  return Math.max(0, flashSale.stockLimit - flashSale.soldCount);
};

// Helper: Get time remaining in milliseconds
export const getTimeRemaining = (flashSale: FlashSale): number => {
  return Math.max(0, flashSale.endDate.getTime() - new Date().getTime());
};
