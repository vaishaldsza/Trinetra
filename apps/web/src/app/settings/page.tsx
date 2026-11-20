import { DEMO_BANNER_LABEL } from '@trinetra/shared';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-400">Configure emergency escalation thresholds, notifications, and demo parameters</p>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-semibold text-white text-sm">{DEMO_BANNER_LABEL} Guard</h3>
            <p className="text-xs text-slate-400">Restricts real SMS/Voice calls and forces [DEMO] labeling on all outgoing data</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ENABLED
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-semibold text-white text-sm">Fall Detection Confirmation Window</h3>
            <p className="text-xs text-slate-400">Seconds before unconfirmed potential fall escalates to emergency contacts</p>
          </div>
          <span className="font-mono text-sm text-slate-300">30 seconds</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Health Signal Estimation</h3>
            <p className="text-xs text-slate-400">PPG camera pulse estimation status</p>
          </div>
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
            Non-Diagnostic Only
          </span>
        </div>
      </div>
    </div>
  );
}
