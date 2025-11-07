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
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/types';

export interface CategoryWithCount extends Category {
  productCount: number;
}

const categoriesCollection = collection(db, 'categories');

// Get all categories
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate()
    })) as Category[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const docRef = doc(db, 'categories', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate()
      } as Category;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Search categories by name
export const searchCategories = async (searchTerm: string): Promise<Category[]> => {
  try {
    // Note: For better search, consider using Algolia or Elasticsearch
    // This is a basic implementation
    const snapshot = await getDocs(categoriesCollection);

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate()
    })) as Category[];

    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Add new category (Admin function)
export const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(categoriesCollection, {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update category (Admin function)
export const updateCategory = async (
  id: string, 
  categoryData: Partial<Category>
): Promise<void> => {
  try {
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, {
      ...categoryData,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete category (Admin function)
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get categories with product counts
export const getCategoriesWithProductCount = async (): Promise<CategoryWithCount[]> => {
  try {
    const categories = await getAllCategories();
    const productsCollection = collection(db, 'products');
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        // Query to count products in this category
        const q = query(
          productsCollection,
          where('category', '==', category.id)
        );
        
        const countSnapshot = await getCountFromServer(q);
        
        return {
          ...category,
          productCount: countSnapshot.data().count
        };
      })
    );
    
    return categoriesWithCount;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

