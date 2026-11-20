'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, LanguageSwitcher } from './I18nProvider';
import { ThemeToggle } from './ThemeProvider';

export default function HeaderNav({ isSupabaseConfigured }: { isSupabaseConfigured: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/incidents', label: t('nav.incidents') },
    { href: '/map', label: t('nav.map') },
    { href: '/agents', label: t('nav.agents') },
    { href: '/communications', label: t('nav.communications') },
    { href: '/analytics', label: t('nav.analytics') },
    { href: '/demo', label: t('nav.demo'), isDemo: true },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4 lg:gap-8 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30">
                T
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-wider text-orange-600 dark:text-orange-500 leading-none">
                  TRINETRA
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight font-medium mt-0.5">
                  {t('common.command_center')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                if (link.isDemo) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 text-sm font-bold rounded-md transition border ${
                        isActive
                          ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40'
                          : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 border-orange-500/20'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Cluster: Language Switcher, Theme Toggle, Settings, Sign In */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />

            <Link
              href="/settings"
              className={`hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-md transition ${
                pathname === '/settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.settings')}
            </Link>

            <Link
              href="/login"
              className="px-3.5 py-1.5 text-sm font-semibold rounded-md bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm"
            >
              {isSupabaseConfigured ? t('nav.login') : t('nav.admin')}
            </Link>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Scroll */}
        <nav aria-label="Mobile Navigation" className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-200 dark:border-slate-800/60 text-xs no-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 font-medium rounded whitespace-nowrap transition ${
                  isActive
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={`px-2.5 py-1 font-medium rounded whitespace-nowrap transition ${
              pathname === '/settings'
                ? 'bg-orange-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t('nav.settings')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
