'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured) {
      setMessage({
        text: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable real authentication.',
        type: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              role: 'user'
            }
          }
        });
        if (error) throw error;
        setMessage({ text: 'Account created! Please check your email or sign in.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillEmail = (role: 'hiker' | 'admin') => {
    const demoEmail = role === 'admin' ? 'admin.demo@trinetra.safety' : 'hiker.demo@trinetra.safety';
    setEmail(demoEmail);
    setMessage({
      text: `Prefilled email for ${role.toUpperCase()}. Enter your password to sign in.`,
      type: 'success'
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Create your TRINETRA account' : 'Sign in to TRINETRA'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp ? 'Join the outdoor safety network' : 'Access emergency dispatch & monitoring'}
          </p>
        </div>

        {/* Clear warning if Supabase is not configured */}
        {!isSupabaseConfigured && (
          <div className="p-3.5 rounded-lg text-xs border bg-amber-950/60 border-amber-800 text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Supabase not configured</span>
            </div>
            <p className="text-[11px] text-amber-300/80">
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment to authenticate users.
            </p>
          </div>
        )}

        {message && (
          <div
            className={`p-3 rounded-lg text-sm border ${
              message.type === 'error'
                ? 'bg-red-950/60 border-red-800 text-red-200'
                : message.type === 'warning'
                ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleAuth}>
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Arjun Sharma"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-md shadow-orange-600/30 text-sm"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="hover:text-orange-400 underline transition"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Demo Mode Email Prefill: Only rendered when NEXT_PUBLIC_DEMO_MODE=true */}
        {isDemoMode && (
          <div className="pt-4 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
              DEMO MODE EMAIL PREFILL
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePrefillEmail('hiker')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition"
              >
                Prefill Hiker Email
              </button>
              <button
                type="button"
                onClick={() => handlePrefillEmail('admin')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition"
              >
                Prefill Admin Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
