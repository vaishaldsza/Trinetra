'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DEMO_SCENARIOS,
  DemoScenarioDefinition,
  DemoScenarioStep,
  DEMO_BANNER_LABEL
} from '@trinetra/shared';
import { dataProvider } from '../../lib/dataProvider';
import { supabase } from '../../lib/supabase';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { useI18n } from '../../components/I18nProvider';

export default function DemoPage() {
  const { t, formatDate } = useI18n();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [executedLogs, setExecutedLogs] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(dataProvider.isMock);

  useEffect(() => {
    if (dataProvider.isMock) {
      setIsAdmin(true);
      return;
    }
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          setIsAdmin(profile?.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, []);

  const activeScenario: DemoScenarioDefinition = DEMO_SCENARIOS[selectedScenarioIndex];
  const currentStep: DemoScenarioStep = activeScenario.steps[currentStepIndex];

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setTimeout(() => {
        if (currentStepIndex < activeScenario.steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 3500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, activeScenario]);

  // Log execution when step changes
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] [DEMO] ${activeScenario.title} · Step ${currentStep.stepNumber}: ${currentStep.title} -> ${currentStep.simulatedAction}`;
    setExecutedLogs((prev) => [logEntry, ...prev.slice(0, 9)]);
  }, [selectedScenarioIndex, currentStepIndex]);

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const res = await dataProvider.resetDemoData();
      setResetMessage(`Successfully purged ${res.deletedCount} demo record(s). Non-demo data preserved.`);
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: unknown) {
      setResetMessage(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6 max-w-6xl mx-auto">
      {/* Header Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-orange-600 text-white p-1.5 rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('demo.title')}
            </h1>
            <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {DEMO_BANNER_LABEL}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {t('demo.subtitle')}
          </p>
        </div>

        {/* Reset Demo Data Action: Only visible/enabled in mock mode or if user is admin */}
        {dataProvider.isMock || isAdmin ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDemoData}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900 border border-red-300 dark:border-red-700/60 text-xs font-bold text-red-800 dark:text-red-200 transition shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? t('demo.btn_resetting') : t('demo.btn_reset_data')}
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {t('demo.admin_required')}
          </div>
        )}
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Scenario Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {DEMO_SCENARIOS.map((sc, idx) => {
          const isSelected = idx === selectedScenarioIndex;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(idx)}
              className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between gap-3 shadow-sm ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 ring-1 ring-orange-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 font-mono">
                    Scenario 0{idx + 1}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{sc.title.replace(/^Scenario \d+:\s*/, '')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{sc.subtitle}</p>
              </div>

              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span>{sc.steps.length} Steps</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium">Select →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Player & Timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 sm:p-7 flex flex-col gap-6 shadow-xl">
        {/* Scenario Player Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20">
                SCENARIO 0{selectedScenarioIndex + 1}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{activeScenario.title}</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{activeScenario.subtitle}</p>
          </div>

          {/* Timeline Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isPlaying
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {isPlaying ? t('demo.btn_pause') : t('demo.btn_play')}
            </button>
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title={t('demo.btn_reset_step')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progression Visual Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {activeScenario.steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPassed = idx < currentStepIndex;
            return (
              <button
                key={st.stepNumber}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex-1 min-w-[120px] p-2.5 rounded-xl border text-left transition ${
                  isCurrent
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                    : isPassed
                    ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    Step {st.stepNumber}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  ) : null}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{st.title}</div>
              </button>
            );
          })}
        </div>

        {/* Current Step Narration & Inspection Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-950/90 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                {currentStep.stepNumber}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{currentStep.title}</h3>
            </div>

            {currentStep.dataBadge && (
              <span className="bg-slate-200 dark:bg-slate-900 text-cyan-800 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md self-start sm:self-auto">
                {currentStep.dataBadge}
              </span>
            )}
          </div>

          {/* Narration Description */}
          <div className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-normal bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
            {currentStep.narration}
          </div>

          {/* Simulated Action Taken */}
          <div className="flex items-center gap-3 text-xs bg-white dark:bg-slate-900/70 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{t('demo.action_label')}</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{currentStep.simulatedAction}</span>
          </div>

          {/* Payload Inspector if present */}
          {currentStep.payloadSummary && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Structured Mutation Payload [DEMO]
              </span>
              <pre className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-amber-900 dark:text-amber-200/90 overflow-x-auto">
                {JSON.stringify(currentStep.payloadSummary, null, 2)}
              </pre>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => {
                if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
              }}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {t('demo.btn_prev_step')}
            </button>

            {currentStepIndex < activeScenario.steps.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {t('demo.btn_next_step')} ({currentStepIndex + 2} / {activeScenario.steps.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {t('demo.status_complete')}
                </span>
                <Link
                  href="/incidents"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white transition"
                >
                  {t('demo.inspect_incident')} →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Terminal Execution Feed */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-500" />
            {t('demo.audit_log')}
          </h3>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Memory Mock Provider Active</span>
        </div>

        <div className="flex flex-col gap-1.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto">
          {executedLogs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-orange-500">❯</span> {log}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
