'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { dataProvider } from '../../../lib/dataProvider';
import {
  IncidentWithRelations,
  IncidentPriority,
  IncidentStatus,
  HEALTH_DISCLAIMER
} from '@trinetra/shared';
import {
  ArrowLeft,
  HeartPulse,
  Brain,
  MapPin,
  Clock,
  Send,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useI18n } from '../../../components/I18nProvider';

export default function IncidentDetailPage() {
  const { t, formatDate } = useI18n();
  const params = useParams();
  const incidentId = params?.id as string;

  const [incident, setIncident] = useState<IncidentWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncident = async () => {
    if (!incidentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dataProvider.getIncident(incidentId);
      setIncident(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load incident record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-40 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-2xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-12 text-center flex flex-col items-center gap-4 my-8">
        <AlertTriangle className="w-12 h-12 text-rose-500 dark:text-rose-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Error Loading Incident</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">{error}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchIncident}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs rounded-lg transition"
          >
            Retry
          </button>
          <Link
            href="/incidents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('incident_detail.back_link')}
          </Link>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center flex flex-col items-center gap-4 my-8">
        <AlertTriangle className="w-12 h-12 text-orange-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Incident Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
          No incident record exists with identifier <span className="font-mono text-slate-800 dark:text-slate-300">{incidentId}</span>.
        </p>
        <Link
          href="/incidents"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('incident_detail.back_link')}
        </Link>
      </div>
    );
  }

  const triage = incident.triage_assessment;
  const vitals = incident.vital_readings || [];
  const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const agentTasks = incident.agent_tasks || [];
  const notifications = incident.notifications || [];

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6">
      {/* Back link & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('incident_detail.dossier_title')} #{incident.id.slice(0, 8)}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase ${
                  incident.priority === IncidentPriority.CRITICAL
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                    : incident.priority === IncidentPriority.HIGH
                    ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {t(`enums.priority_${incident.priority?.toLowerCase() || 'medium'}`)}
              </span>
              {incident.is_demo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                  {t('incident_detail.simulated_tag')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Source: <span className="text-slate-700 dark:text-slate-300 font-medium">{t(`enums.source_${incident.detection_source?.toLowerCase() || 'manual'}`)}</span> · Reported on{' '}
              {formatDate(incident.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${
              incident.status === IncidentStatus.RESOLVED
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : incident.status === IncidentStatus.EMERGENCY_INITIATED
                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 animate-pulse'
                : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
            }`}
          >
            {t(`enums.status_${incident.status?.toLowerCase() || 'active'}`)}
          </span>
          <Link
            href={`/map?lat=${incident.latitude}&lon=${incident.longitude}`}
            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            {t('home.live_rescue_map')}
          </Link>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overview, Triage & Vitals (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card 1: Hiker & GPS Location Overview */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              {t('incident_detail.card_location')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3.5 flex flex-col gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Hiker Identity</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm">
                  {incident.profile?.full_name || 'Anonymous User'}
                </span>
                <span className="text-slate-600 dark:text-slate-400">Phone: {incident.profile?.phone || 'N/A'}</span>
                <span className="text-slate-600 dark:text-slate-400">Email: {incident.profile?.email || 'N/A'}</span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3.5 flex flex-col gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">GPS Coordinates</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold text-sm">
                  {incident.latitude ? `${incident.latitude.toFixed(5)}, ${incident.longitude?.toFixed(5)}` : 'Unknown'}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Last Fix: {incident.last_known_location_at ? formatDate(incident.last_known_location_at) : 'N/A'}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Trail Sector: {(incident.hiking_session?.start_location as any)?.trail || 'Solang Valley Sector'}
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Voice Triage Assessment */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              {t('incident_detail.card_triage')}
            </h2>

            {triage ? (
              <div className="flex flex-col gap-4 text-xs">
                {/* Structured parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Consciousness</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{triage.consciousness_status}</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Breathing Difficulty</span>
                    <span className={`font-bold capitalize ${triage.breathing_difficulty ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {triage.breathing_difficulty ? 'Severe' : 'Normal'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Bleeding Status</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{triage.bleeding_status}</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Mobility</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{triage.mobility_status}</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Pain Level (1-10)</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{triage.pain_level} / 10</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Injury Region</span>
                    <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{triage.injury_location || 'Not reported'}</span>
                  </div>
                </div>

                {/* Summary Transcript */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Triage Field Summary</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                    {triage.assessment_summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('incident_detail.no_triage')}
              </div>
            )}
          </section>

          {/* Card 3: Camera PPG Optical Vitals */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" />
                {t('incident_detail.card_vitals')}
              </h2>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30">
                NON-DIAGNOSTIC
              </span>
            </div>

            {/* Non-diagnostic notice */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
              <span className="font-bold">Disclaimer: </span>
              {HEALTH_DISCLAIMER}
            </div>

            {latestVital ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1 text-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Pulse</span>
                  <span className="text-3xl font-black text-red-600 dark:text-red-400">{latestVital.heart_rate_estimate}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">BPM (camera optical)</span>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Signal Quality Index</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{ width: `${Math.round(latestVital.signal_quality * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                    {Math.round(latestVital.signal_quality * 100)}% reliability
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Measurement Period</span>
                    <p className="text-slate-900 dark:text-white font-bold text-sm mt-1">{latestVital.measurement_duration} seconds</p>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Recorded at {formatDate(latestVital.recorded_at)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('incident_detail.no_vitals')}
              </div>
            )}
          </section>

          {/* Card 4: Multi-Agent Intelligence Findings */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-500" />
              {t('incident_detail.card_agent_tasks')}
            </h2>

            <div className="flex flex-col gap-3">
              {agentTasks.length === 0 ? (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t('incident_detail.no_tasks')}
                </div>
              ) : (
                agentTasks.map((taskItem) => (
                  <div
                    key={taskItem.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {taskItem.agent_name.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {taskItem.task_type}
                        </span>
                        {taskItem.is_demo && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400">
                            {t('incident_detail.simulated_tag')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        {taskItem.status}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {(taskItem.output_data as any)?.summary || 'Task completed successfully.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Outbound Notifications & Timeline (1 Col) */}
        <div className="flex flex-col gap-6">
          {/* Outbound Notifications */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              {t('incident_detail.card_notifications')}
            </h2>

            <div className="flex flex-col gap-3">
              {notifications.length === 0 ? (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t('incident_detail.no_notifications')}
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-3.5 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                        {notif.channel} ALERT
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          notif.status === 'delivered'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400'
                        }`}
                      >
                        {t(`enums.notif_${notif.status?.toLowerCase() || 'queued'}`)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-col gap-0.5">
                      <span>Recipient: <span className="text-slate-900 dark:text-slate-200 font-mono">{notif.recipient}</span></span>
                      {notif.provider_reference && (
                        <span>Ref: <span className="text-slate-700 dark:text-slate-300 font-mono">{notif.provider_reference}</span></span>
                      )}
                      {notif.error_message && (
                        <span className="text-amber-700 dark:text-amber-400 text-[10px] mt-1">{notif.error_message}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Chronological Incident Timeline */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              Audit Timeline
            </h2>

            <div className="flex flex-col gap-3 text-xs pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-0.5 relative pl-4">
                <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-bold text-slate-900 dark:text-white">Incident Triggered</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {formatDate(incident.created_at)} · Source: {t(`enums.source_${incident.detection_source?.toLowerCase() || 'manual'}`)}
                </span>
              </div>

              {incident.triage_assessment && (
                <div className="flex flex-col gap-0.5 relative pl-4">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="font-bold text-slate-900 dark:text-white">Voice Triage Completed</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {formatDate(incident.triage_assessment.created_at)} · Structured evaluation generated
                  </span>
                </div>
              )}

              {latestVital && (
                <div className="flex flex-col gap-0.5 relative pl-4">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-red-500" />
                  <span className="font-bold text-slate-900 dark:text-white">Optical PPG Pulse Recorded</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {formatDate(latestVital.recorded_at)} · {latestVital.heart_rate_estimate} BPM
                  </span>
                </div>
              )}

              {agentTasks.map((t) => (
                <div key={t.id} className="flex flex-col gap-0.5 relative pl-4">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{t.agent_name.replace('_', ' ')} Executed</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {formatDate(t.created_at)} · Status: {t.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
