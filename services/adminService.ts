import { User } from '@/types';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Promote user to admin (super-admin only)
export const promoteToAdmin = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      isAdmin: true,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Demote admin to customer
export const demoteToCustomer = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'customer',
      isAdmin: false,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: User[] = snapshot.docs.map((docSnap) => {
      return {
        id: docSnap.id,
        ...(docSnap.data() as User),
      } as User;
    });
    return users;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
