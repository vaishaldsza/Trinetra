'use client';

import { useState, useEffect } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Notification, NotificationChannel, NotificationStatus } from '@trinetra/shared';
import { Radio, MessageSquare, PhoneCall, AlertCircle, RefreshCw, Filter, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../components/I18nProvider';

export default function CommunicationsPage() {
  const { t, formatDate } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataProvider.getNotifications();
      setNotifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch communication logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = notifications.filter((n) => {
    if (channelFilter !== 'ALL' && n.channel !== channelFilter) return false;
    if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-orange-500" />
            {t('comms.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('comms.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('comms.refresh_btn')}
        </button>
      </div>

      {/* Carrier Simulation Notice */}
      <div className="rounded-xl border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-3.5 flex items-center gap-3 text-xs text-sky-900 dark:text-sky-200">
        <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
        <span>{t('comms.mock_carrier_banner')}</span>
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 flex flex-wrap items-center gap-4 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-300">Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-600 dark:text-slate-400">{t('comms.filter_channel')}:</label>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">{t('comms.all_channels')}</option>
            <option value={NotificationChannel.SMS}>{t('comms.channel_sms')}</option>
            <option value={NotificationChannel.VOICE}>{t('comms.channel_voice')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-600 dark:text-slate-400">{t('comms.filter_status')}:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">{t('comms.all_statuses')}</option>
            <option value={NotificationStatus.DELIVERED}>{t('enums.notif_delivered')}</option>
            <option value={NotificationStatus.SENT}>{t('enums.notif_sent')}</option>
            <option value={NotificationStatus.PENDING}>{t('enums.notif_queued')}</option>
            <option value={NotificationStatus.FAILED}>{t('enums.notif_failed')}</option>
            <option value={NotificationStatus.RETRY_SCHEDULED}>{t('enums.notif_queued')}</option>
          </select>
        </div>
      </div>

      {/* Communications Dispatches Table */}
      {error ? (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-10 text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Error Loading Communications</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs rounded-lg transition"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
          {t('comms.empty_comms')}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">{t('comms.col_channel')}</th>
                  <th className="py-3 px-4">{t('comms.col_recipient')}</th>
                  <th className="py-3 px-4">{t('comms.col_status')}</th>
                  <th className="py-3 px-4">{t('comms.col_ref')}</th>
                  <th className="py-3 px-4">{t('comms.col_retries')}</th>
                  <th className="py-3 px-4">{t('comms.col_dispatched')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {n.channel === NotificationChannel.SMS ? (
                          <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        ) : (
                          <PhoneCall className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                        )}
                        <span className="uppercase">{n.channel}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-300">
                      {n.recipient}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                          n.status === NotificationStatus.DELIVERED
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : n.status === NotificationStatus.SENT
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
                            : n.status === NotificationStatus.FAILED
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                            : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                        }`}
                      >
                        {t(`enums.notif_${n.status?.toLowerCase() || 'queued'}`)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {n.provider_reference || 'N/A'}
                      {n.is_demo && (
                        <span className="ml-2 text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                          DEMO
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {n.retry_count ?? 0} / 3
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {formatDate(n.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
