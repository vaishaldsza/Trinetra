'use client';

import { useState, useEffect } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { IncidentWithRelations, IncidentPriority, DetectionSource } from '@trinetra/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, RefreshCw, AlertCircle, HeartPulse, ShieldAlert, Clock, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<IncidentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataProvider.getIncidents({ demoOnly: 'ALL' });
      setIncidents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to compute analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // 1. Compute Priority Breakdown from real incident data
  const priorityData = [
    {
      name: 'Critical',
      count: incidents.filter((i) => i.priority === IncidentPriority.CRITICAL).length,
      fill: '#ef4444'
    },
    {
      name: 'High',
      count: incidents.filter((i) => i.priority === IncidentPriority.HIGH).length,
      fill: '#f97316'
    },
    {
      name: 'Medium',
      count: incidents.filter((i) => i.priority === IncidentPriority.MEDIUM).length,
      fill: '#eab308'
    },
    {
      name: 'Low',
      count: incidents.filter((i) => i.priority === IncidentPriority.LOW).length,
      fill: '#3b82f6'
    }
  ];

  // 2. Compute Detection Source Breakdown from real incident data
  const sourceCounts: Record<string, number> = {
    'Fall Detector': 0,
    'Manual SOS': 0,
    'PPG Vital Anomaly': 0,
    'Audio Distress': 0,
    'System / Other': 0
  };

  incidents.forEach((inc) => {
    switch (inc.detection_source) {
      case DetectionSource.ACCELEROMETER:
        sourceCounts['Fall Detector']++;
        break;
      case DetectionSource.MANUAL:
        sourceCounts['Manual SOS']++;
        break;
      case DetectionSource.VITAL_MONITOR:
        sourceCounts['PPG Vital Anomaly']++;
        break;
      case DetectionSource.AUDIO_YAMNET:
        sourceCounts['Audio Distress']++;
        break;
      default:
        sourceCounts['System / Other']++;
        break;
    }
  });

  const sourceData = [
    { name: 'Fall Detector', value: sourceCounts['Fall Detector'], color: '#f97316' },
    { name: 'Manual SOS', value: sourceCounts['Manual SOS'], color: '#ef4444' },
    { name: 'PPG Vital Anomaly', value: sourceCounts['PPG Vital Anomaly'], color: '#ec4899' },
    { name: 'Audio Distress', value: sourceCounts['Audio Distress'], color: '#8b5cf6' },
    { name: 'System / Other', value: sourceCounts['System / Other'], color: '#64748b' }
  ].filter((s) => s.value > 0);

  // 3. Compute Hourly Incident Distribution from real incident data
  const hourlyBuckets: Record<string, number> = {};
  for (let h = 0; h < 24; h += 2) {
    const label = `${String(h).padStart(2, '0')}:00`;
    hourlyBuckets[label] = 0;
  }

  incidents.forEach((inc) => {
    if (inc.created_at) {
      const hour = new Date(inc.created_at).getHours();
      const bucketHour = Math.floor(hour / 2) * 2;
      const label = `${String(bucketHour).padStart(2, '0')}:00`;
      if (hourlyBuckets[label] !== undefined) {
        hourlyBuckets[label]++;
      }
    }
  });

  const hourlyData = Object.entries(hourlyBuckets).map(([time, count]) => ({
    time,
    count
  }));

  // 4. Compute Average Pulse BPM from real vital readings
  const allVitals = incidents.flatMap((i) => i.vital_readings || []);
  const avgPulse =
    allVitals.length > 0
      ? Math.round(allVitals.reduce((acc, v) => acc + (v.heart_rate_estimate || 0), 0) / allVitals.length)
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-800/40 rounded-2xl" />
          <div className="h-72 bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 flex flex-col items-center justify-center gap-3 text-center my-8">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <h3 className="text-base font-bold text-white">Analytics Unavailable</h3>
        <p className="text-xs text-red-300/80 max-w-sm">{error}</p>
        <button
          onClick={fetchAnalyticsData}
          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Analytics
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-orange-500" />
            Safety Analytics & SAR Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated metrics computed dynamically from active incident logs and on-trail telemetry.
          </p>
        </div>

        <button
          onClick={fetchAnalyticsData}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recompute
        </button>
      </div>

      {/* Primary KPI Cards (Computed from data + clearly labeled illustrative demo stats) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Computed from data */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Incidents</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">{incidents.length}</div>
          <span className="mt-2 text-[11px] text-slate-400">Computed from incident records</span>
        </div>

        {/* KPI 2: Computed from data */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Critical Share</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-red-400">
            {incidents.length > 0
              ? `${Math.round((incidents.filter((i) => i.priority === IncidentPriority.CRITICAL).length / incidents.length) * 100)}%`
              : '0%'}
          </div>
          <span className="mt-2 text-[11px] text-slate-400">Proportion of critical events</span>
        </div>

        {/* KPI 3: Computed from data */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Avg Pulse in Distress</span>
            <HeartPulse className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {avgPulse > 0 ? `${avgPulse} BPM` : 'N/A'}
          </div>
          <span className="mt-2 text-[11px] text-slate-400">Non-diagnostic camera estimate</span>
        </div>

        {/* KPI 4: Illustrative metric (labeled clearly per requirements) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Mean Coordination Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-cyan-400">~45s</div>
          <span className="mt-2 text-[10px] font-bold text-amber-400 uppercase">
            [DEMO] illustrative
          </span>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Computed Incidents by Priority */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Incidents by Priority</h3>
            <span className="text-[10px] font-mono text-slate-400">Computed live</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Computed Detection Source Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Detection Source Breakdown</h3>
            <span className="text-[10px] font-mono text-slate-400">Computed live</span>
          </div>
          <div className="w-full h-64 flex items-center justify-center">
            {sourceData.length === 0 ? (
              <span className="text-xs text-slate-400">No incident sources to display</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Hourly Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Diurnal Incident Distribution by Hour</h3>
            <span className="text-[10px] font-mono text-slate-400">Computed from timestamps</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ea580c"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ea580c' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
