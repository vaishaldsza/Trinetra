'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataProvider, DashboardStats, DataUpdateEvent } from '../../lib/dataProvider';
import { IncidentWithRelations, IncidentPriority, IncidentStatus } from '@trinetra/shared';
import { useI18n } from '../../components/I18nProvider';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Play,
  Pause,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Flame,
  Radio
} from 'lucide-react';

export default function DashboardPage() {
  const { t, formatDate, formatNumber } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<IncidentWithRelations[]>([]);
  const [liveEvents, setLiveEvents] = useState<DataUpdateEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(dataProvider.isRealtimeSimulationActive());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      setError(null);
      const [s, incs] = await Promise.all([
        dataProvider.getStats(),
        dataProvider.getIncidents({ demoOnly: 'ALL' })
      ]);
      setStats(s);
      setRecentIncidents(incs.slice(0, 5));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime data events
    const unsubscribe = dataProvider.subscribe((event) => {
      setLiveEvents((prev) => [event, ...prev.slice(0, 7)]);
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleSimulation = () => {
    const nextState = dataProvider.toggleRealtimeSimulation();
    setIsSimulating(nextState);
  };

  const handleManualTrigger = async () => {
    if (dataProvider.triggerManualIncident) {
      await dataProvider.triggerManualIncident();
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('common.error')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm rounded-lg transition shadow-sm"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6">
      {/* Header with Realtime Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.title')}
            </h1>
            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {dataProvider.isMock ? 'Mock Telemetry' : 'Live Connected'}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Realtime Simulation Controls (Mock Mode) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSimulation}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm ${
              isSimulating
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/80'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isSimulating ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Pause className="w-3.5 h-3.5" />
                Realtime Feed (Active ~30s)
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <Play className="w-3.5 h-3.5" />
                Realtime Feed Paused
              </>
            )}
          </button>

          {dataProvider.isMock && (
            <button
              onClick={handleManualTrigger}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition shadow-sm"
              title="Immediately emit a new simulated incident"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Simulate SOS [DEMO]
            </button>
          )}
        </div>
      </div>

      {/* Primary Telemetry Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Hikers */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_hikers_monitored')}</span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(stats?.activeHikers ?? 0)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">tracked users</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            <span>{formatNumber(stats?.activeSessions ?? 0)} sessions active now</span>
          </div>
        </div>

        {/* Card 2: Active Emergency Incidents */}
        <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-red-700 dark:text-red-300">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_active_incidents')}</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 animate-bounce" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600 dark:text-red-400">
              {formatNumber(stats?.activeIncidents ?? 0)}
            </span>
            <span className="text-xs text-red-600/80 dark:text-red-300/80">unresolved</span>
          </div>
          <div className="mt-3 text-[11px] text-red-700 dark:text-red-400 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>{formatNumber(stats?.criticalIncidents ?? 0)} critical high priority</span>
          </div>
        </div>

        {/* Card 3: Resolved Incidents */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Rescues / Handled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(stats?.totalIncidents ?? 0)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({formatNumber(stats?.resolvedIncidents ?? 0)} resolved)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Safe evac rate 100% in test zone</span>
          </div>
        </div>

        {/* Card 4: Emergency Dispatches */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatches & Alerts</span>
            <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(stats?.dispatchedNotifications ?? 0)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              sent ({formatNumber(stats?.pendingNotifications ?? 0)} pending)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>SMS & synthesized voice delivery</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Recent Active Incidents & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Incidents List (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-500" />
              {t('dashboard.recent_incidents_title')}
            </h2>
            <Link
              href="/incidents"
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 flex items-center gap-1"
            >
              {t('dashboard.view_all_incidents')}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentIncidents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
                {t('dashboard.empty_incidents')}
              </div>
            ) : (
              recentIncidents.map((inc) => (
                <Link
                  key={inc.id}
                  href={`/incidents/${inc.id}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/90 p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                        inc.priority === IncidentPriority.CRITICAL
                          ? 'bg-red-500 ring-4 ring-red-500/20 animate-pulse'
                          : inc.priority === IncidentPriority.HIGH
                          ? 'bg-orange-500 ring-4 ring-orange-500/20'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {inc.profile?.full_name || 'Anonymous Hiker'}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {inc.incident_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {inc.is_demo && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                            {t('common.demo_badge')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {inc.triage_assessment?.assessment_summary ||
                          `GPS: ${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                        inc.status === IncidentStatus.RESOLVED
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : inc.status === IncidentStatus.EMERGENCY_INITIATED
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                          : 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                      }`}
                    >
                      {inc.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {formatDate(inc.created_at || '', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Telemetry Event Stream (1 Col) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              Live Telemetry Feed
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Realtime</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 flex flex-col gap-3 min-h-[360px] shadow-sm">
            {liveEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-slate-400">
                <Clock className="w-8 h-8 text-slate-400 mb-2 animate-spin" />
                <p>Waiting for incoming events...</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Realtime feed emits updates every ~30s.</p>
              </div>
            ) : (
              liveEvents.map((ev, index) => (
                <div
                  key={`${ev.timestamp}-${index}`}
                  className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/80 p-3 text-xs flex flex-col gap-1 border-l-2 border-l-cyan-500 shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono uppercase font-bold text-cyan-600 dark:text-cyan-400">
                      {ev.type.replace('_', ' ')}
                    </span>
                    <span>{formatDate(ev.timestamp, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-snug">{ev.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
