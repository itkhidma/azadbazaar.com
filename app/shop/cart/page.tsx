'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Use replace to avoid adding to history
        router.replace('/auth/login?redirect=/shop/checkout');
      } else {
        // Use replace to avoid adding to history
        router.replace('/shop/checkout');
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
