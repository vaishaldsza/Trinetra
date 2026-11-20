import Link from 'next/link';
import { DEMO_BANNER_LABEL } from '@trinetra/shared';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-400">Real-time emergency monitoring and dispatch status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            {DEMO_BANNER_LABEL}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Emergencies</div>
          <div className="text-2xl font-black text-red-500">1</div>
          <div className="text-[11px] text-slate-500">Critical priority alert</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sessions</div>
          <div className="text-2xl font-black text-orange-400">1</div>
          <div className="text-[11px] text-slate-500">Live trail monitoring</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Tasks</div>
          <div className="text-2xl font-black text-emerald-400">2</div>
          <div className="text-[11px] text-slate-500">Fetch.ai coordinating</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Notifications</div>
          <div className="text-2xl font-black text-cyan-400">0</div>
          <div className="text-[11px] text-slate-500">SMS / Voice queue clear</div>
        </div>
      </div>

      {/* Main Incident Feed Stub */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">Recent Incident Activity</h2>
          <Link href="/incidents" className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition">
            View All Incidents →
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-800 text-red-300">
                  CRITICAL
                </span>
                <span className="text-sm font-semibold text-white">Fall Detected · Rohtang Pass</span>
                <span className="text-xs text-amber-400 font-mono">[DEMO]</span>
              </div>
              <p className="text-xs text-slate-400">
                Hiker: Arjun Sharma · Lat: 32.3716, Lng: 77.2466 · Immobilized
              </p>
            </div>
            <Link
              href="/incidents/d0000000-0000-0000-0000-000000000001"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-slate-200 border border-slate-700 transition"
            >
              Inspect
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
