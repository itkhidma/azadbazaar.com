import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserAddress } from '@/types/user';

// Add a new address to user profile
export const addUserAddress = async (
  userId: string,
  address: Omit<UserAddress, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAddress: UserAddress = {
      ...address,
      id: addressId,
      createdAt: new Date(),
    };

    const userRef = doc(db, 'users', userId);
    
    // If this is the first address or marked as default, set it as default
    if (address.isDefault) {
      await updateDoc(userRef, {
        addresses: arrayUnion(newAddress),
        defaultAddressId: addressId,
      });
    } else {
      await updateDoc(userRef, {
        addresses: arrayUnion(newAddress),
      });
    }

    return addressId;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update an existing address
export const updateUserAddress = async (
  userId: string,
  addressId: string,
  updates: Partial<Omit<UserAddress, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const addresses = (userData.addresses || []) as UserAddress[];
    
    const updatedAddresses = addresses.map((addr) =>
      addr.id === addressId ? { ...addr, ...updates } : addr
    );

    const updateData: any = { addresses: updatedAddresses };
    
    // If setting this as default, update defaultAddressId
    if (updates.isDefault) {
      // Remove default from other addresses
      const finalAddresses = updatedAddresses.map((addr) =>
        addr.id === addressId ? addr : { ...addr, isDefault: false }
      );
      updateData.addresses = finalAddresses;
      updateData.defaultAddressId = addressId;
    }

    await updateDoc(userRef, updateData);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete an address
export const deleteUserAddress = async (
  userId: string,
  addressId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const addresses = (userData.addresses || []) as UserAddress[];
    
    const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);
    
    const updateData: any = { addresses: updatedAddresses };
    
    // If deleting the default address, set another as default
    if (userData.defaultAddressId === addressId && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
      updateData.defaultAddressId = updatedAddresses[0].id;
      updateData.addresses = updatedAddresses;
    } else if (updatedAddresses.length === 0) {
      updateData.defaultAddressId = null;
    }

    await updateDoc(userRef, updateData);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Mark address as last used (for smart sorting)
export const markAddressAsUsed = async (
  userId: string,
  addressId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const addresses = (userData.addresses || []) as UserAddress[];
    
    const updatedAddresses = addresses.map((addr) =>
      addr.id === addressId ? { ...addr, lastUsedAt: new Date() } : addr
    );

    await updateDoc(userRef, { addresses: updatedAddresses });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all user addresses sorted by priority
export const getUserAddresses = async (userId: string): Promise<UserAddress[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    const addresses = (userData.addresses || []) as UserAddress[];
    
    // Sort: Default first, then by last used, then by creation date
    return addresses.sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      
      if (a.lastUsedAt && b.lastUsedAt) {
        return b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
      }
      if (a.lastUsedAt) return -1;
      if (b.lastUsedAt) return 1;
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    // If user is blocked or has permission issues, return empty array
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.warn('User blocked or permission denied, returning empty addresses');
      return [];
    }
    throw new Error(error.message);
  }
};
