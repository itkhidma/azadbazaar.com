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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Banner } from '@/types';

const bannersCollection = collection(db, 'banners');

// Get all active banners
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const q = query(
      bannersCollection, 
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Banner[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all banners (for admin)
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const q = query(bannersCollection, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Banner[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get banner by ID
export const getBannerById = async (id: string): Promise<Banner | null> => {
  try {
    const docRef = doc(db, 'banners', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate()
      } as Banner;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Add new banner (Admin function)
export const addBanner = async (bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(bannersCollection, {
      ...bannerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update banner (Admin function)
export const updateBanner = async (
  id: string, 
  bannerData: Partial<Banner>
): Promise<void> => {
  try {
    const docRef = doc(db, 'banners', id);
    await updateDoc(docRef, {
      ...bannerData,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete banner (Admin function)
export const deleteBanner = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (error: any) {
    throw new Error(error.message);
  }
};
