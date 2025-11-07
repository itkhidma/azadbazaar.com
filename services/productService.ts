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
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

const productsCollection = collection(db, 'products');

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      expiryDate: doc.data().expiryDate 
        ? (doc.data().expiryDate as Timestamp).toDate() 
        : undefined,
    })) as Product[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        expiryDate: data.expiryDate 
          ? (data.expiryDate as Timestamp).toDate() 
          : undefined,
      } as Product;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(
      productsCollection, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      expiryDate: doc.data().expiryDate 
        ? (doc.data().expiryDate as Timestamp).toDate() 
        : undefined,
    })) as Product[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Search products by name
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    // Note: For better search, consider using Algolia or Elasticsearch
    // This is a basic implementation
    const snapshot = await getDocs(productsCollection);
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      expiryDate: doc.data().expiryDate 
        ? (doc.data().expiryDate as Timestamp).toDate() 
        : undefined,
    })) as Product[];
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Add new product (Admin function)
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(productsCollection, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update product (Admin function)
export const updateProduct = async (
  id: string, 
  productData: Partial<Product>
): Promise<void> => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete product (Admin function)
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get best seller products (featured or by sales count)
export const getBestSellerProducts = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    // First try to get featured products
    const featuredQuery = query(
      productsCollection,
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const featuredSnapshot = await getDocs(featuredQuery);
    
    if (!featuredSnapshot.empty) {
      return featuredSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
        expiryDate: doc.data().expiryDate 
          ? (doc.data().expiryDate as Timestamp).toDate() 
          : undefined,
      })) as Product[];
    }
    
    // If no featured products, get by sales count
    const salesQuery = query(
      productsCollection,
      orderBy('salesCount', 'desc'),
      limit(limitCount)
    );
    
    const salesSnapshot = await getDocs(salesQuery);
    
    if (!salesSnapshot.empty) {
      return salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
        expiryDate: doc.data().expiryDate 
          ? (doc.data().expiryDate as Timestamp).toDate() 
          : undefined,
      })) as Product[];
    }
    
    // If no sales data, just return latest products
    return getAllProducts();
  } catch (error: any) {
    // If index doesn't exist yet, fall back to latest products
    console.log('Best seller query failed, falling back to latest products:', error.message);
    const q = query(productsCollection, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      expiryDate: doc.data().expiryDate 
        ? (doc.data().expiryDate as Timestamp).toDate() 
        : undefined,
    })) as Product[];
  }
};

// Get new arrivals (recently added products)
export const getNewArrivals = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    const q = query(
      productsCollection,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      expiryDate: doc.data().expiryDate 
        ? (doc.data().expiryDate as Timestamp).toDate() 
        : undefined,
    })) as Product[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};
