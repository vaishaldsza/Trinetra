'use client';

import Link from 'next/link';
import { APP_NAME, HEALTH_DISCLAIMER } from '@trinetra/shared';
import { Shield, Activity, MapPin, Radio, Cpu, HeartPulse, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../components/I18nProvider';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-12 sm:gap-16 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 p-8 sm:p-14 text-center shadow-xl dark:shadow-2xl transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,88,12,0.12),rgba(255,255,255,0))]" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            {t('home.hero_badge')}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            {t('home.headline_part1')} <br />
            {t('home.headline_part2')} <br />
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-500 bg-clip-text text-transparent">
              {t('home.headline_part3')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            {t('home.hero_description')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition transform hover:-translate-y-0.5"
            >
              {t('home.open_command_center')}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 transition shadow-sm"
            >
              <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              {t('home.live_rescue_map')}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('home.pill_zero_wait')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('home.pill_offline_triage')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('home.pill_multi_agent')}
            </span>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.feature1_title')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('home.feature1_desc')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.feature2_title')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('home.feature2_desc')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.feature3_title')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('home.feature3_desc')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.feature4_title')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('home.feature4_desc')}
          </p>
        </div>
      </section>

      {/* Live System Metrics Banner */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600/10 dark:bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Responder Operations Online</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active monitoring zone: Pir Panjal & Great Himalayan National Park Sectors</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition shadow-sm"
          >
            {t('home.open_command_center')}
          </Link>
          <Link
            href="/incidents"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            {t('nav.incidents')}
          </Link>
        </div>
      </section>

      {/* Non-Diagnostic Disclaimer */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Safety Notice: </span>
        {HEALTH_DISCLAIMER}
      </div>
    </div>
  );
}
