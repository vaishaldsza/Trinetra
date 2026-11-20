'use client';

import { useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  Settings,
  Database,
  Play,
  Pause,
  PlusCircle,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Globe,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Check,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock
} from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { useI18n } from '../../components/I18nProvider';
import { WebLanguage } from '../../i18n';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage, formatDate, formatNumber } = useI18n();

  const [isSimulating, setIsSimulating] = useState(dataProvider.isRealtimeSimulationActive());
  const [lastEmittedMessage, setLastEmittedMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleToggleSimulation = () => {
    const next = dataProvider.toggleRealtimeSimulation();
    setIsSimulating(next);
  };

  const handleManualTrigger = async () => {
    if (dataProvider.triggerManualIncident) {
      const inc = await dataProvider.triggerManualIncident();
      setLastEmittedMessage(`Generated incident #${inc.id.slice(0, 8)} (${inc.priority.toUpperCase()})`);
      setTimeout(() => setLastEmittedMessage(null), 4000);
    }
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const res = await dataProvider.resetDemoData();
      setResetMessage(`Successfully purged ${res.deletedCount} demo record(s). Non-demo data preserved.`);
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: unknown) {
      setResetMessage(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6 max-w-4xl mx-auto">
      {/* Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('settings.title')}
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {isSupabaseConfigured ? 'Supabase Live' : 'Mock Admin Mode'}
          </span>
        </div>
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Card 1: Appearance & Theme */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            {t('settings.appearance_card')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('settings.appearance_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Light Theme */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 shadow-sm ${
              theme === 'light'
                ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-500/10 ring-2 ring-orange-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              {theme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">{t('theme.light')}</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block leading-relaxed">
                {t('settings.theme_light_desc')}
              </span>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 shadow-sm ${
              theme === 'dark'
                ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-500/10 ring-2 ring-orange-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
                <Moon className="w-4 h-4" />
              </div>
              {theme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">{t('theme.dark')}</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block leading-relaxed">
                {t('settings.theme_dark_desc')}
              </span>
            </div>
          </button>

          {/* System Default Theme */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 shadow-sm ${
              theme === 'system'
                ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-500/10 ring-2 ring-orange-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Laptop className="w-4 h-4" />
              </div>
              {theme === 'system' && (
                <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">{t('theme.system')}</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block leading-relaxed">
                {t('settings.theme_system_desc')}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Card 2: Regional Language */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-500" />
            {t('settings.language_card')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('settings.language_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Dropdown Selector */}
          <div className="flex flex-col gap-2">
            <label htmlFor="settings-language-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('languages.select_language')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-orange-500">
                <Globe className="w-4 h-4" />
              </div>
              <select
                id="settings-language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as WebLanguage)}
                className="w-full py-2.5 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 shadow-sm appearance-none cursor-pointer transition hover:border-slate-300 dark:hover:border-slate-600"
              >
                <option value="en">English (Default)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Live Locale Preview Format Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 flex flex-col gap-1.5 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              {t('settings.language_sample_label')}
            </span>
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
              <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
              <span className="font-mono font-medium">{formatDate(new Date())}</span>
            </div>
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
              <span className="text-slate-500 dark:text-slate-400">Distress Telemetry:</span>
              <span className="font-mono font-medium">{formatNumber(12450)} km²</span>
            </div>
          </div>
        </div>
      </section>

      {/* Card 3: Realtime Mock Telemetry Generator */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t('settings.telemetry_card')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
              {t('settings.telemetry_desc')}
            </p>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
            DEMO
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-bold text-slate-900 dark:text-white">
              {isSimulating ? t('settings.sim_active') : t('settings.sim_paused')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Interval: ~30 seconds
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleToggleSimulation}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isSimulating
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4" />
                {t('settings.sim_toggle_pause')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t('settings.sim_toggle_resume')}
              </>
            )}
          </button>

          {dataProvider.isMock && (
            <button
              onClick={handleManualTrigger}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              {t('settings.emit_sos_btn')}
            </button>
          )}

          {lastEmittedMessage && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
              ✓ {lastEmittedMessage}
            </span>
          )}
        </div>
      </section>

      {/* Card 4: Backend & Cloud Synchronization */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-500" />
            {t('settings.provider_card')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('settings.provider_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Database Layer */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">PostgreSQL / Supabase</span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {isSupabaseConfigured
                ? t('settings.supabase_connected')
                : t('settings.mock_provider_active')}
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              {isSupabaseConfigured
                ? t('settings.provider_details_live')
                : t('settings.provider_details_mock')}
            </p>
          </div>

          {/* Telephony Dispatch Gateway */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t('settings.carrier_guard_title')}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Twilio SMS & ElevenLabs Guard Active
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              {t('settings.carrier_guard_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Card 5: Demo Data Maintenance (Danger Zone) */}
      <section className="rounded-2xl border border-red-200 dark:border-red-950/80 bg-red-50/50 dark:bg-red-950/10 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-red-900 dark:text-red-400 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400" />
            {t('settings.purge_card')}
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800 uppercase">
            Maintenance
          </span>
        </div>

        <p className="text-xs text-red-800 dark:text-red-300/90 leading-relaxed">
          {t('settings.purge_desc')}
        </p>

        <div>
          <button
            onClick={handleResetDemoData}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white transition shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? t('settings.purging_btn') : t('settings.purge_btn')}
          </button>
        </div>
      </section>

      {/* Access Control Notice */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed shadow-sm">
        <span className="font-bold text-slate-800 dark:text-slate-300">{t('settings.role_notice_title')}: </span>
        {t('settings.role_notice_desc')}
      </div>
    </div>
  );
}
