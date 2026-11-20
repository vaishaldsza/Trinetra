import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Kannada } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { APP_NAME, APP_TAGLINE, DEMO_BANNER_LABEL } from '@trinetra/shared';
import { isSupabaseConfigured } from '../lib/supabase';
import RouteGuard from '../components/RouteGuard';
import { ThemeProvider } from '../components/ThemeProvider';
import { I18nProvider } from '../components/I18nProvider';
import HeaderNav from '../components/HeaderNav';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-devanagari',
});

const notoSansKannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-kannada',
});

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${notoSansDevanagari.variable} ${notoSansKannada.variable}`}>
      <head>
        {/* Anti-flash theme inline script executes synchronously before DOM paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('trinetra_theme');
                  var pref = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
                  var isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <ThemeProvider>
          <I18nProvider>
            {/* Supabase Not Configured Banner (High contrast in both light & dark modes) */}
            {!isSupabaseConfigured && (
              <aside
                aria-label="Mock Admin Mode Banner"
                className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold tracking-wide flex items-center justify-between shadow-sm z-50"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase font-black">
                    MOCK / DEMO
                  </span>
                  <span>
                    Supabase not configured — Running in Mock Admin Mode with full dashboard access & simulated live telemetry.
                  </span>
                </div>
                <span className="hidden sm:inline text-[11px] font-mono opacity-90 font-bold">v1.0-mvp</span>
              </aside>
            )}

            {/* Demo Mode Flag Banner (High contrast in both themes) */}
            {isDemoMode && isSupabaseConfigured && (
              <aside
                aria-label="Demo Mode Banner"
                className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-sm z-50"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                    {DEMO_BANNER_LABEL}
                  </span>
                  <span>Demonstration Mode Active — Real Outbound Dispatches Suppressed</span>
                </div>
                <span className="text-[11px] opacity-90 font-mono font-bold">v1.0-mvp</span>
              </aside>
            )}

            {/* Navigation Header */}
            <HeaderNav isSupabaseConfigured={isSupabaseConfigured} />

            {/* Main Viewport */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              <RouteGuard>{children}</RouteGuard>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
              <p>© 2026 TRINETRA · Intelligent Outdoor Safety & Emergency Response Platform · Non-diagnostic</p>
            </footer>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
