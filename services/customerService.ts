import { 
  collection, 
  query, 
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Customer {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string;
  role: string;
  createdAt: Date;
  isBlocked?: boolean;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  newThisMonth: number;
}

// Get all customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'customer'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Get customer order statistics
    const customersWithStats = await Promise.all(
      snapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const uid = userData.uid;
        
        // Get customer's orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        let totalSpent = 0;
        let lastOrderDate: Date | undefined = undefined;
        
        ordersSnapshot.forEach((orderDoc) => {
          const orderData = orderDoc.data();
          totalSpent += orderData.totalAmount || 0;
          
          const orderDate = (orderData.createdAt as Timestamp)?.toDate();
          if (!lastOrderDate || (orderDate && orderDate > lastOrderDate)) {
            lastOrderDate = orderDate;
          }
        });
        
        return {
          uid: userData.uid,
          email: userData.email || null,
          displayName: userData.displayName || null,
          photoURL: userData.photoURL || null,
          phoneNumber: userData.phoneNumber || undefined,
          role: userData.role,
          createdAt: (userData.createdAt as Timestamp).toDate(),
          isBlocked: userData.isBlocked || false,
          totalOrders: ordersSnapshot.size,
          totalSpent: Math.round(totalSpent),
          lastOrderDate,
        };
      })
    );
    
    return customersWithStats;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get customer statistics
export const getCustomerStats = async (): Promise<CustomerStats> => {
  try {
    // Total customers
    const totalCustomersSnapshot = await getCountFromServer(
      query(collection(db, 'users'), where('role', '==', 'customer'))
    );
    const totalCustomers = totalCustomersSnapshot.data().count;
    
    // Active customers (not blocked)
    const activeCustomersSnapshot = await getCountFromServer(
      query(
        collection(db, 'users'),
        where('role', '==', 'customer'),
        where('isBlocked', '==', false)
      )
    );
    const activeCustomers = activeCustomersSnapshot.data().count;
    
    // Blocked customers
    const blockedCustomersSnapshot = await getCountFromServer(
      query(
        collection(db, 'users'),
        where('role', '==', 'customer'),
        where('isBlocked', '==', true)
      )
    );
    const blockedCustomers = blockedCustomersSnapshot.data().count;
    
    // New customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonthSnapshot = await getCountFromServer(
      query(
        collection(db, 'users'),
        where('role', '==', 'customer'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
      )
    );
    const newThisMonth = newThisMonthSnapshot.data().count;
    
    return {
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      newThisMonth,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Block/Unblock customer
export const toggleCustomerBlock = async (uid: string, isBlocked: boolean): Promise<void> => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userDocRef = userSnapshot.docs[0].ref;
      await updateDoc(userDocRef, {
        isBlocked,
      });
    } else {
      throw new Error('User not found');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete customer
export const deleteCustomer = async (uid: string): Promise<void> => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userDocRef = userSnapshot.docs[0].ref;
      await deleteDoc(userDocRef);
    } else {
      throw new Error('User not found');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get customer details by UID
export const getCustomerById = async (uid: string): Promise<Customer | null> => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      
      // Get customer's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      let totalSpent = 0;
      let lastOrderDate: Date | undefined = undefined;
      
      ordersSnapshot.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        totalSpent += orderData.totalAmount || 0;
        
        const orderDate = (orderData.createdAt as Timestamp)?.toDate();
        if (!lastOrderDate || (orderDate && orderDate > lastOrderDate)) {
          lastOrderDate = orderDate;
        }
      });
      
      return {
        uid: userData.uid,
        email: userData.email || null,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || undefined,
        role: userData.role,
        createdAt: (userData.createdAt as Timestamp).toDate(),
        isBlocked: userData.isBlocked || false,
        totalOrders: ordersSnapshot.size,
        totalSpent: Math.round(totalSpent),
        lastOrderDate,
      };
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Check if user is blocked
export const isUserBlocked = async (uid: string): Promise<boolean> => {
  try {
    // Try to get user document by querying with uid field
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData.isBlocked === true;
    }
    
    return false;
  } catch (error: any) {
    // If query fails (permission denied), try direct document access
    // Some setups use uid as document ID
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.isBlocked === true;
      }
    } catch (innerError) {
      // Silently fail
    }
    
    // Default to false (not blocked) if we can't determine
    return false;
  }
};
