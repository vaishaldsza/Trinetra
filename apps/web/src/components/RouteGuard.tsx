'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Routes accessible without authentication even when Supabase is configured
const PUBLIC_ROUTES = ['/', '/login'];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // If Supabase is not configured, we run in Mock Admin Mode: full access
    if (!isSupabaseConfigured) {
      setAuthorized(true);
      return;
    }

    // Public pages are always accessible
    if (PUBLIC_ROUTES.includes(pathname)) {
      setAuthorized(true);
      return;
    }

    // Check active session
    let mounted = true;
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session) {
          setAuthorized(false);
          router.replace('/login');
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        if (!mounted) return;
        setAuthorized(false);
        router.replace('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session && !PUBLIC_ROUTES.includes(pathname)) {
        setAuthorized(false);
        router.replace('/login');
      } else {
        setAuthorized(true);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  // While checking auth on a protected route in Supabase mode, show a loading placeholder
  if (isSupabaseConfigured && !PUBLIC_ROUTES.includes(pathname) && authorized !== true) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Checking authorization...</span>
      </div>
    );
  }

  return <>{children}</>;
}
