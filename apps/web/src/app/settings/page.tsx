'use client';

import { useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Settings, Database, Play, Pause, PlusCircle, CheckCircle2, ShieldCheck, Radio, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [isSimulating, setIsSimulating] = useState(dataProvider.isRealtimeSimulationActive());
  const [lastEmittedMessage, setLastEmittedMessage] = useState<string | null>(null);

  const handleToggleSimulation = () => {
    const next = dataProvider.toggleRealtimeSimulation();
    setIsSimulating(next);
  };

  const handleManualTrigger = async () => {
    if (dataProvider.triggerManualIncident) {
      const inc = await dataProvider.triggerManualIncident();
      setLastEmittedMessage(`Generated incident #${inc.id.slice(0, 8)} (${inc.priority.toUpperCase()})`);
      setTimeout(() => setLastEmittedMessage(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6 max-w-4xl">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-orange-500" />
          Dashboard Settings & Telemetry Controls
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure telemetry data providers, realtime mock simulation feeds, and deployment status.
        </p>
      </div>

      {/* Section 1: Realtime Mock Telemetry Generator */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Realtime Demonstration Feed
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulates live hiker movements and periodic new emergency incidents (~30s intervals) without page reloads.
            </p>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            DEMO
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleToggleSimulation}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isSimulating
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isSimulating ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Pause className="w-4 h-4" />
                Simulation Active (Click to Pause)
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Simulation Paused (Click to Resume)
              </>
            )}
          </button>

          {dataProvider.isMock && (
            <button
              onClick={handleManualTrigger}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Emit Instant SOS Incident
            </button>
          )}

          {lastEmittedMessage && (
            <span className="text-xs font-semibold text-emerald-400 animate-fadeIn">
              ✓ {lastEmittedMessage}
            </span>
          )}
        </div>
      </section>

      {/* Section 2: Backend & Database Connectivity */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          Backend & Storage Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 flex flex-col gap-1.5">
            <span className="text-slate-400 font-medium">Supabase Data Layer</span>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              <span className="font-bold text-white text-sm">
                {isSupabaseConfigured ? 'Connected (Postgres & Realtime)' : 'Mock Provider Active'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              {isSupabaseConfigured
                ? 'Production backend connected with Row Level Security.'
                : 'Using in-memory seeded provider with Solang/Hampta trail scenarios.'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 flex flex-col gap-1.5">
            <span className="text-slate-400 font-medium">Edge Function Dispatch Gateway</span>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-sm">Twilio & ElevenLabs Guard</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Hard demo guard active: outbound SMS & voice calls are simulated with <code className="text-orange-400">[DEMO]</code> references.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Safety Guard Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 leading-relaxed">
        <span className="font-bold text-slate-300">Role-Based Access: </span>
        When Supabase is configured, this dashboard enforces admin role restrictions via PostgreSQL RLS policies.
        In mock demonstration mode, full administrative telemetry is accessible for evaluation.
      </div>
    </div>
  );
}
