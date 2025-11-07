'use client';

import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/adminHelpers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin(user)) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin(user)) {
    return null;
  }

  return <>{children}</>;
}
