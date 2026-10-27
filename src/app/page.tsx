"use client";
import { useEffect } from 'react';
import { useSession } from '../hooks/use-session';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(user.role === 'owner' ? '/dashboard' : '/kasir');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return null;
}