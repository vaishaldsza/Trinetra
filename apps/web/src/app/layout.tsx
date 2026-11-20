import type { Metadata } from 'next';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { APP_NAME, APP_TAGLINE, DEMO_BANNER_LABEL } from '@trinetra/shared';
import { isSupabaseConfigured } from '../lib/supabase';
import RouteGuard from '../components/RouteGuard';

export const metadata: Metadata = {
  title: `${APP_NAME} - Outdoor Safety & Emergency Response Dashboard`,
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans antialiased bg-slate-950 text-slate-100">
        {/* Supabase Not Configured Banner (Mock Admin Mode) */}
        {!isSupabaseConfigured && (
          <aside aria-label="Mock Admin Mode Banner" className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold tracking-wide flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase font-black">
                MOCK / DEMO
              </span>
              <span>Supabase not configured — Running in Mock Admin Mode with full dashboard access & simulated live telemetry.</span>
            </div>
            <span className="hidden sm:inline text-[11px] font-mono opacity-80">v1.0-mvp</span>
          </aside>
        )}

        {/* Demo Mode Flag Banner */}
        {isDemoMode && isSupabaseConfigured && (
          <aside aria-label="Demo Mode Banner" className="bg-amber-500/90 text-slate-950 px-4 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                {DEMO_BANNER_LABEL}
              </span>
              <span>Demonstration Mode Active — Real Outbound Dispatches Suppressed</span>
            </div>
            <span className="text-[11px] opacity-80 font-mono">v1.0-mvp</span>
          </aside>
        )}

        {/* Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6 lg:gap-8">
                <Link href="/" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30">
                    T
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg tracking-wider text-orange-500 leading-none">TRINETRA</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tight font-medium mt-0.5">Command Center</span>
                  </div>
                </Link>

                <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1">
                  <Link href="/dashboard" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Dashboard
                  </Link>
                  <Link href="/incidents" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Incidents
                  </Link>
                  <Link href="/map" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Rescue Map
                  </Link>
                  <Link href="/agents" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Agents
                  </Link>
                  <Link href="/communications" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Communications
                  </Link>
                  <Link href="/analytics" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Analytics
                  </Link>
                  <Link href="/demo" className="px-3 py-1.5 text-sm font-bold rounded-md text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition border border-orange-500/20">
                    Demo Scenarios
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/settings" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                  Settings
                </Link>
                <Link href="/login" className="px-3.5 py-1.5 text-sm font-semibold rounded-md bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm">
                  {isSupabaseConfigured ? 'Sign In' : 'Admin'}
                </Link>
              </div>
            </div>

            {/* Mobile Horizontal Navigation Scroll */}
            <nav aria-label="Mobile Navigation" className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-800/60 text-xs no-scrollbar">
              <Link href="/dashboard" className="px-2.5 py-1 font-medium rounded bg-slate-800/60 text-slate-200 whitespace-nowrap">
                Dashboard
              </Link>
              <Link href="/incidents" className="px-2.5 py-1 font-medium rounded bg-slate-800/60 text-slate-200 whitespace-nowrap">
                Incidents
              </Link>
              <Link href="/map" className="px-2.5 py-1 font-medium rounded bg-slate-800/60 text-slate-200 whitespace-nowrap">
                Rescue Map
              </Link>
              <Link href="/agents" className="px-2.5 py-1 font-medium rounded bg-slate-800/60 text-slate-200 whitespace-nowrap">
                Agents
              </Link>
              <Link href="/communications" className="px-2.5 py-1 font-medium rounded bg-slate-800/60 text-slate-200 whitespace-nowrap">
                Comms
              </Link>
              <Link href="/analytics" className="px-2.5 py-1 font-medium rounded bg-slate-800/60 text-slate-200 whitespace-nowrap">
                Analytics
              </Link>
              <Link href="/demo" className="px-2.5 py-1 font-bold rounded bg-orange-600/30 text-orange-400 border border-orange-500/40 whitespace-nowrap">
                Demo
              </Link>
            </nav>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <RouteGuard>
            {children}
          </RouteGuard>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
          <p>© 2026 TRINETRA · Intelligent Outdoor Safety & Emergency Response Platform · Non-diagnostic</p>
        </footer>
      </body>
    </html>
  );
}
