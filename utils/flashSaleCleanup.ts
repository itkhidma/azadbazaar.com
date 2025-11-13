/**
 * Utility to clean up expired flash sales
 * This should be called periodically or on app load to ensure
 * products don't continue showing expired flash sale prices
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const cleanupExpiredFlashSales = async (): Promise<number> => {
  try {
    const now = new Date();
    const productsCollection = collection(db, 'products');
    
    // Query products with active flash sales that have expired
    const q = query(
      productsCollection,
      where('isOnFlashSale', '==', true),
      where('flashSaleEndDate', '<=', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    let cleanedCount = 0;
    
    // Update each expired product
    const updatePromises = snapshot.docs.map(async (docSnap) => {
      const productRef = doc(db, 'products', docSnap.id);
      const data = docSnap.data();
      
      // Restore original price and clear flash sale fields
      await updateDoc(productRef, {
        isOnFlashSale: false,
        price: data.originalPrice || data.price, // Restore original price
        originalPrice: null,
        flashSaleEndDate: null,
        flashSaleDiscountPercentage: null,
        flashSaleSoldCount: null,
        flashSaleStockLimit: null,
        updatedAt: serverTimestamp(),
      });
      
      cleanedCount++;
    });
    
    await Promise.all(updatePromises);
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired flash sales`);
    }
    
    return cleanedCount;
  } catch (error: any) {
    console.error('Error cleaning up expired flash sales:', error);
    return 0;
  }
};

/**
 * Clean up sold out flash sales
 * Products where flashSaleSoldCount >= flashSaleStockLimit
 */
export const cleanupSoldOutFlashSales = async (): Promise<number> => {
  try {
    const productsCollection = collection(db, 'products');
    
    // Get all products with active flash sales
    const q = query(
      productsCollection,
      where('isOnFlashSale', '==', true)
    );
    
    const snapshot = await getDocs(q);
    let cleanedCount = 0;
    
    // Check each product for sold out status
    const updatePromises = snapshot.docs
      .filter(docSnap => {
        const data = docSnap.data();
        return data.flashSaleSoldCount >= data.flashSaleStockLimit;
      })
      .map(async (docSnap) => {
        const productRef = doc(db, 'products', docSnap.id);
        const data = docSnap.data();
        
        // Restore original price and clear flash sale fields
        await updateDoc(productRef, {
          isOnFlashSale: false,
          price: data.originalPrice || data.price,
          originalPrice: null,
          flashSaleEndDate: null,
          flashSaleDiscountPercentage: null,
          flashSaleSoldCount: null,
          flashSaleStockLimit: null,
          updatedAt: serverTimestamp(),
        });
        
        cleanedCount++;
      });
    
    await Promise.all(updatePromises);
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} sold out flash sales`);
    }
    
    return cleanedCount;
  } catch (error: any) {
    console.error('Error cleaning up sold out flash sales:', error);
    return 0;
  }
};
