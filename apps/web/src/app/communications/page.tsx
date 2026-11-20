export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Communication Center</h1>
          <p className="text-sm text-slate-400">Emergency notifications, Twilio SMS/Voice logs, and delivery status</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
          DEMO COMM LOGS
        </span>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Outbound Emergency Transmissions</h2>
          <span className="text-xs text-slate-400 font-mono">Real Notifications: OFF (Demo Guard)</span>
        </div>

        <div className="divide-y divide-slate-800 text-xs text-slate-300">
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-white">Twilio SMS → +919876543219 (Vikram Sharma)</div>
              <div className="text-slate-400">Payload: [DEMO] EMERGENCY ALERT for Arjun Sharma. Fall detected at 32.3716, 77.2466.</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
              DELIVERED (DEMO)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
