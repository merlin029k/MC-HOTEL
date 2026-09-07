'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Reads the admin session token from localStorage and redirects to /admin/login
// if it's missing. Session validity itself is enforced by the API (401 on expiry).
export function useAdminAuth() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('mc_hotel_admin_token');
    if (!stored) {
      router.replace('/admin/login');
      return;
    }
    setToken(stored);
    setReady(true);
  }, [router]);

  return { token, ready };
}
