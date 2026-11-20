import Link from 'next/link';
import { APP_NAME, APP_TAGLINE, HEALTH_DISCLAIMER } from '@trinetra/shared';
import { Shield, Activity, MapPin, Radio, Cpu, HeartPulse, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 p-8 sm:p-14 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,88,12,0.15),rgba(255,255,255,0))]" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            AI-Powered Wilderness Safety Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            See the Danger. <br />
            Sense the Risk. <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Save a Life.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            {APP_NAME} is an intelligent, offline-first outdoor safety and emergency response ecosystem.
            Combining on-device sensor fusion, contact-free camera PPG vitals, voice triage, and autonomous multi-agent rescue coordination.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition transform hover:-translate-y-0.5"
            >
              Open Command Center
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 px-6 py-3.5 text-sm font-semibold text-slate-200 transition"
            >
              <MapPin className="w-4 h-4 text-orange-400" />
              Live Rescue Map
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero-Wait SOS
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Offline Sensor Triage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Autonomous Multi-Agent SAR
            </span>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-700 transition">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Fall & Impact Detection</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Autonomous multi-phase inertial monitoring detects free-falls followed by hard impact and subsequent inactivity, initiating automatic SOS if unresponsive.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-700 transition">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Optical PPG Vitals</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Zero-hardware pulse estimation using smartphone camera frames, bandpass filtering, and spectral peak analysis for rapid on-trail physiological checks.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-700 transition">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">5-Agent Rescue Mesh</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Specialized backend agents concurrently evaluate hospitals, medical severity, extraction corridors, SAR coordination, and bilingual alert drafting.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3 hover:border-slate-700 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Resilient Dispatches</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Multi-channel Twilio SMS & synthesized voice calls with exponential backoff retries, delivery tracking, and strict consent validation for emergency contacts.
          </p>
        </div>
      </section>

      {/* Live System Metrics Banner */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Responder Operations Online</h4>
            <p className="text-xs text-slate-400">Active monitoring zone: Pir Panjal & Great Himalayan National Park Sectors</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition"
          >
            Go to Operations Center
          </Link>
          <Link
            href="/incidents"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Browse Incidents
          </Link>
        </div>
      </section>

      {/* Non-Diagnostic Disclaimer */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Safety Notice: </span>
        {HEALTH_DISCLAIMER}
      </div>
    </div>
  );
}
