import Link from 'next/link';
import { HEALTH_DISCLAIMER } from '@trinetra/shared';

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/incidents" className="text-xs font-semibold text-slate-400 hover:text-white transition">
          ← Back to Incidents
        </Link>
        <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded">
          DEMO INCIDENT
        </span>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">Incident Report #{params.id.slice(0, 8)}</h1>
            <p className="text-xs text-slate-400">Triggered by Accelerometer Impact Event</p>
          </div>
          <span className="self-start px-2.5 py-1 text-xs font-bold rounded bg-red-950 border border-red-800 text-red-200">
            CRITICAL ESCALATION
          </span>
        </div>

        {/* Triage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">Triage Summary</h3>
            <p className="text-sm text-slate-200">
              Conscious, dazed. Reported acute right ankle pain (8/10) and shortness of breath.
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-1">
              <div>• Mobility: Immobilized</div>
              <div>• Visible Bleeding: Minor arm lacerations</div>
              <div>• Breathing: Labored</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">Estimated Vitals</h3>
            <div className="text-2xl font-black text-rose-400">
              114 <span className="text-xs font-normal text-slate-400">BPM (Camera PPG)</span>
            </div>
            <p className="text-[11px] text-amber-400/90 leading-tight">
              {HEALTH_DISCLAIMER}
            </p>
          </div>
        </div>

        {/* Agent Activity */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Fetch.ai Agentverse Coordination</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-slate-200">Location Intelligence Agent</span>
              <span className="text-emerald-400 font-mono">Nearest Hospital: Manali Civil (14.2 km, ETA 38m)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Medical Intelligence Agent</span>
              <span className="text-amber-400 font-mono">Flag: High hypoxia / fracture risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
