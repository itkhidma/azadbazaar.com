export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAdmin: boolean;  // Admin flag
  role: 'customer' | 'admin' | 'super-admin';  // Optional: Multiple roles
  createdAt: Date;
}

export interface UserProfile extends User {
  phoneNumber?: string;
  address?: Address; // Legacy - kept for backward compatibility
  addresses?: UserAddress[]; // New: Multiple addresses support
  defaultAddressId?: string; // Quick reference to default address
}

export interface Address {
  street: string;
  district: string;
  landmark?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserAddress {
  id: string;
  label: string; // "Home", "Office", "Parents House", etc.
  isDefault: boolean;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  createdAt: Date;
  lastUsedAt?: Date; // Track when last used for smart sorting
}
