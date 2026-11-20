import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@trinetra/shared';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider">
        <span>Offline-First Emergency Response</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl">
        {APP_NAME}
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-orange-400 max-w-2xl">
        {APP_TAGLINE}
      </p>

      <p className="text-slate-400 max-w-2xl text-base leading-relaxed">
        An AI-powered outdoor safety and emergency response ecosystem designed to protect hikers and mountaineers.
        Featuring automatic fall detection, offline AI voice triage, camera-based heart-rate estimation, and Fetch.ai multi-agent incident coordination.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition"
        >
          Open Command Center
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
        >
          Sign In
        </Link>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full pt-16 text-left">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
          <div className="text-orange-500 font-bold text-lg">Offline-First Safety</div>
          <p className="text-slate-400 text-sm">
            Local fall detection, offline SQLite persistence, and instant critical SOS escalation that never delays on network or AI calls.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
          <div className="text-orange-500 font-bold text-lg">Multi-Agent Intelligence</div>
          <p className="text-slate-400 text-sm">
            Fetch.ai Agentverse agents orchestrate location mapping, medical triage analysis, route intelligence, and emergency reporting.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
          <div className="text-orange-500 font-bold text-lg">Real-Time Operations</div>
          <p className="text-slate-400 text-sm">
            Centralized monitoring platform displaying interactive rescue maps, real-time incident queues, and automated communication logs.
          </p>
        </div>
      </div>
    </div>
  );
}
