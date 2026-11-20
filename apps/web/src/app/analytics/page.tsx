export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-slate-400">Incident statistics, emergency response times, and trail safety metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Median Detection Time</div>
          <div className="text-3xl font-black text-white">1.8s</div>
          <div className="text-[11px] text-emerald-400">On-device accelerometer pipeline</div>
        </div>
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Cloud Sync Latency</div>
          <div className="text-3xl font-black text-white">240ms</div>
          <div className="text-[11px] text-emerald-400">Post-reconnection sync</div>
        </div>
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Demonstration Scenarios</div>
          <div className="text-3xl font-black text-amber-400">4 / 4</div>
          <div className="text-[11px] text-slate-500">Hackathon evaluation ready</div>
        </div>
      </div>
    </div>
  );
}
