import { User } from '@/types';

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.isAdmin === true || user.role === 'admin' || user.role === 'super-admin';
};

export const isSuperAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'super-admin';
};

export const canManageProducts = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canManageOrders = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canManageUsers = (user: User | null): boolean => {
  return isSuperAdmin(user);
};
