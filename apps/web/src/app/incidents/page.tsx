'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataProvider, IncidentFilters } from '../../lib/dataProvider';
import {
  IncidentWithRelations,
  IncidentStatus,
  IncidentPriority,
  DetectionSource
} from '@trinetra/shared';
import { useI18n } from '../../components/I18nProvider';
import { Search, Filter, ShieldAlert, ArrowRight, Eye, RefreshCw } from 'lucide-react';

export default function IncidentsListPage() {
  const { t, formatDate } = useI18n();
  const [incidents, setIncidents] = useState<IncidentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<IncidentPriority | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<DetectionSource | 'ALL'>('ALL');
  const [demoFilter, setDemoFilter] = useState<boolean | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: IncidentFilters = {
        status: statusFilter,
        priority: priorityFilter,
        source: sourceFilter,
        demoOnly: demoFilter,
        searchQuery
      };
      const data = await dataProvider.getIncidents(filters);
      setIncidents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, priorityFilter, sourceFilter, demoFilter, searchQuery]);

  const getPriorityLabel = (priority: IncidentPriority) => {
    switch (priority) {
      case IncidentPriority.CRITICAL:
        return t('enums.priority_critical');
      case IncidentPriority.HIGH:
        return t('enums.priority_high');
      case IncidentPriority.MEDIUM:
        return t('enums.priority_medium');
      case IncidentPriority.LOW:
        return t('enums.priority_low');
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.RESOLVED:
        return t('enums.status_resolved');
      case IncidentStatus.CANCELLED:
        return t('enums.status_cancelled');
      case IncidentStatus.DETECTED:
      case IncidentStatus.EMERGENCY_INITIATED:
      case IncidentStatus.ASSISTANCE_REQUESTED:
      case IncidentStatus.ACKNOWLEDGED:
        return t('enums.status_active');
      default:
        return status.replace('_', ' ');
    }
  };

  const getSourceLabel = (source: DetectionSource) => {
    switch (source) {
      case DetectionSource.MANUAL:
        return t('enums.source_manual');
      case DetectionSource.ACCELEROMETER:
        return t('enums.source_fall');
      case DetectionSource.VITAL_MONITOR:
        return t('enums.source_wearable');
      case DetectionSource.AUDIO_YAMNET:
        return t('enums.source_fall');
      case DetectionSource.SYSTEM:
        return t('enums.source_timeout');
      default:
        return source;
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-orange-600 dark:text-orange-500" />
            {t('incidents.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('incidents.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('incidents.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              {t('common.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value={IncidentStatus.DETECTED}>{t('enums.status_active')}</option>
              <option value={IncidentStatus.EMERGENCY_INITIATED}>{t('enums.status_active')} (SOS)</option>
              <option value={IncidentStatus.RESOLVED}>{t('enums.status_resolved')}</option>
              <option value={IncidentStatus.CANCELLED}>{t('enums.status_cancelled')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              {t('common.priority')}
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value={IncidentPriority.CRITICAL}>{t('enums.priority_critical')}</option>
              <option value={IncidentPriority.HIGH}>{t('enums.priority_high')}</option>
              <option value={IncidentPriority.MEDIUM}>{t('enums.priority_medium')}</option>
              <option value={IncidentPriority.LOW}>{t('enums.priority_low')}</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              {t('common.source')}
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value={DetectionSource.MANUAL}>{t('enums.source_manual')}</option>
              <option value={DetectionSource.ACCELEROMETER}>{t('enums.source_fall')}</option>
              <option value={DetectionSource.VITAL_MONITOR}>{t('enums.source_wearable')}</option>
              <option value={DetectionSource.SYSTEM}>{t('enums.source_timeout')}</option>
            </select>
          </div>

          {/* Demo Mode Filter */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Mode</label>
            <select
              value={String(demoFilter)}
              onChange={(e) => {
                const val = e.target.value;
                setDemoFilter(val === 'ALL' ? 'ALL' : val === 'true');
              }}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="true">Demo Only</option>
              <option value="false">Live Real Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List Table / Card View */}
      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 text-center flex flex-col items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('common.error')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">{error}</p>
          <button
            onClick={fetchIncidents}
            className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs rounded-lg transition shadow-sm"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center flex flex-col items-center gap-3 shadow-sm">
          <Filter className="w-10 h-10 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('incidents.empty_filtered')}</h3>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setSourceFilter('ALL');
              setDemoFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 transition p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 ${
                    inc.priority === IncidentPriority.CRITICAL
                      ? 'bg-red-500 ring-4 ring-red-500/20 animate-pulse'
                      : inc.priority === IncidentPriority.HIGH
                      ? 'bg-orange-500 ring-4 ring-orange-500/20'
                      : inc.priority === IncidentPriority.MEDIUM
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {inc.profile?.full_name || 'Anonymous Hiker'}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {inc.incident_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        inc.priority === IncidentPriority.CRITICAL
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                          : inc.priority === IncidentPriority.HIGH
                          ? 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {getPriorityLabel(inc.priority)}
                    </span>
                    {inc.is_demo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                        {t('common.demo_badge')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl line-clamp-1 sm:line-clamp-2">
                    {inc.triage_assessment?.assessment_summary ||
                      `Location: ${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Source: {getSourceLabel(inc.detection_source as DetectionSource)}</span>
                    <span>•</span>
                    <span>
                      GPS: {inc.latitude ? `${inc.latitude.toFixed(4)}, ${inc.longitude?.toFixed(4)}` : 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>
                      Reported: {formatDate(inc.created_at || '', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3 border-t sm:border-t-0 border-slate-200 dark:border-slate-800 pt-3 sm:pt-0">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    inc.status === IncidentStatus.RESOLVED
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : inc.status === IncidentStatus.EMERGENCY_INITIATED
                      ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                      : 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                  }`}
                >
                  {getStatusLabel(inc.status)}
                </span>

                <Link
                  href={`/incidents/${inc.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t('incidents.inspect')}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
