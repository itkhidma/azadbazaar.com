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
  address?: Address;
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
