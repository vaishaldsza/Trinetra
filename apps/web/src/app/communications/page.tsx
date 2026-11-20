'use client';

import { useState, useEffect } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Notification, NotificationChannel, NotificationStatus } from '@trinetra/shared';
import { Radio, MessageSquare, PhoneCall, CheckCircle2, AlertCircle, RefreshCw, Filter } from 'lucide-react';

export default function CommunicationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await dataProvider.getNotifications();
      setNotifications(data);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-orange-500" />
            Emergency Communications Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Outbound SMS alerts, synthetic voice calls, Twilio delivery callbacks, and retry logs.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Comms Log
        </button>
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-300">Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400">Channel:</label>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Channels</option>
            <option value={NotificationChannel.SMS}>SMS Text</option>
            <option value={NotificationChannel.VOICE}>Voice Call</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value={NotificationStatus.DELIVERED}>Delivered</option>
            <option value={NotificationStatus.SENT}>Sent</option>
            <option value={NotificationStatus.PENDING}>Pending</option>
            <option value={NotificationStatus.RETRY_SCHEDULED}>Retry Scheduled</option>
            <option value={NotificationStatus.FAILED}>Failed</option>
          </select>
        </div>
      </div>

      {/* Communications Dispatches Table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm text-slate-400">
          No communication dispatches recorded matching current filters.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Provider Reference</th>
                  <th className="py-3 px-4">Retries</th>
                  <th className="py-3 px-4">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {n.channel === NotificationChannel.SMS ? (
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <PhoneCall className="w-4 h-4 text-orange-400" />
                        )}
                        <span className="uppercase">{n.channel}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {n.recipient}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                          n.status === NotificationStatus.DELIVERED
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : n.status === NotificationStatus.SENT
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : n.status === NotificationStatus.FAILED
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-orange-950 text-orange-400 border border-orange-800'
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {n.provider_reference || 'N/A'}
                      {n.is_demo && (
                        <span className="ml-2 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          DEMO
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {n.retry_count ?? 0} / 3
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(n.created_at || '').toLocaleTimeString()}
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
