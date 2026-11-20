'use client';

import { useState } from 'react';
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
import { BarChart3, TrendingUp, Zap, Shield, HeartPulse, CheckCircle2 } from 'lucide-react';

const PRIORITY_DATA = [
  { name: 'Critical', count: 4, fill: '#ef4444' },
  { name: 'High', count: 6, fill: '#f97316' },
  { name: 'Medium', count: 5, fill: '#eab308' },
  { name: 'Low', count: 2, fill: '#3b82f6' }
];

const SOURCE_DISTRIBUTION = [
  { name: 'Fall Detector', value: 45, color: '#f97316' },
  { name: 'Manual SOS', value: 30, color: '#ef4444' },
  { name: 'PPG Vital Anomaly', value: 15, color: '#ec4899' },
  { name: 'Audio Distress', value: 10, color: '#8b5cf6' }
];

const HOURLY_INCIDENTS = [
  { time: '04:00', count: 1 },
  { time: '06:00', count: 3 },
  { time: '08:00', count: 7 },
  { time: '10:00', count: 12 },
  { time: '12:00', count: 9 },
  { time: '14:00', count: 14 },
  { time: '16:00', count: 8 },
  { time: '18:00', count: 4 },
  { time: '20:00', count: 2 }
];

export default function AnalyticsPage() {
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
            Historical incident distributions, sensor detection accuracy, and mountain rescue response velocity.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
          <TrendingUp className="w-4 h-4" />
          Analytics Engine Online
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Mean Time to Coordinate</span>
          <div className="mt-2 text-3xl font-black text-emerald-400">42s</div>
          <span className="mt-2 text-[11px] text-slate-400">Autonomous 5-agent mesh execution</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Sensor Precision</span>
          <div className="mt-2 text-3xl font-black text-orange-400">96.8%</div>
          <span className="mt-2 text-[11px] text-slate-400">Tri-axial impact & inactivity validation</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">PPG Signal Quality</span>
          <div className="mt-2 text-3xl font-black text-cyan-400">0.91</div>
          <span className="mt-2 text-[11px] text-slate-400">Bandpass filtered optical pulse estimate</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Dispatch Reliability</span>
          <div className="mt-2 text-3xl font-black text-white">99.4%</div>
          <span className="mt-2 text-[11px] text-slate-400">Twilio SMS & voice synthesized retries</span>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Incidents by Priority */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4">
          <h3 className="font-bold text-white text-base">Incidents by Priority Severity</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRIORITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Detection Source Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4">
          <h3 className="font-bold text-white text-base">Distress Detection Source Breakdown</h3>
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SOURCE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {SOURCE_DISTRIBUTION.map((entry, index) => (
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
          </div>
        </div>

        {/* Chart 3: Hourly Activity Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 lg:col-span-2">
          <h3 className="font-bold text-white text-base">Diurnal Incident Occurrence (Mountain Time)</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HOURLY_INCIDENTS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
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
