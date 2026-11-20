import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { APP_NAME, APP_TAGLINE, DEMO_BANNER_LABEL } from '@trinetra/shared';

export const metadata: Metadata = {
  title: `${APP_NAME} - Outdoor Safety & Emergency Response`,
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
        {/* Top Demo Banner: Only shown when NEXT_PUBLIC_DEMO_MODE=true */}
        {isDemoMode && (
          <header className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                {DEMO_BANNER_LABEL}
              </span>
              <span>Outdoor Safety System Demonstration — Real Emergency Dispatches Offline</span>
            </div>
            <span className="text-[11px] opacity-80 font-mono">v1.0-mvp</span>
          </header>
        )}

        {/* Navigation Bar */}
        <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30">
                    T
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg tracking-wider text-orange-500">TRINETRA</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tight -mt-1">Outdoor Safety</span>
                  </div>
                </Link>

                <div className="hidden md:flex items-center space-x-1">
                  <Link href="/dashboard" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition">
                    Command Center
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
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/settings" className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  Settings
                </Link>
                <Link href="/login" className="px-4 py-1.5 text-sm font-semibold rounded-md bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
          <p>© 2026 TRINETRA · Intelligent Outdoor Safety & Emergency Response System · Non-diagnostic</p>
        </footer>
      </body>
    </html>
  );
}
