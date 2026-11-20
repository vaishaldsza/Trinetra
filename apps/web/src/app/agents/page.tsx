'use client';

import { useState, useEffect } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { AgentTask, AgentName } from '@trinetra/shared';
import { Cpu, CheckCircle2, Clock, MapPin, HeartPulse, Compass, ShieldAlert, MessageSquare, AlertCircle } from 'lucide-react';
import { useI18n } from '../../components/I18nProvider';

interface AgentInfo {
  name: AgentName;
  nameKey: string;
  roleKey: string;
  icon: typeof Cpu;
  description: string;
  status: 'ONLINE' | 'ACTIVE' | 'IDLE';
}

const AGENTS_DIRECTORY: AgentInfo[] = [
  {
    name: AgentName.LOCATION_INTELLIGENCE,
    nameKey: 'agents.agent2_name',
    roleKey: 'agents.agent2_role',
    icon: MapPin,
    description: 'Queries OpenStreetMap Overpass API for trauma medical centers, computes distances, and handles timeout fallbacks.',
    status: 'ACTIVE'
  },
  {
    name: AgentName.MEDICAL_INTELLIGENCE,
    nameKey: 'agents.agent1_name',
    roleKey: 'agents.agent1_role',
    icon: HeartPulse,
    description: 'Cross-evaluates conscious responsiveness, reported trauma, and camera optical PPG pulse readings to determine urgency.',
    status: 'ACTIVE'
  },
  {
    name: AgentName.ROUTE_INTELLIGENCE,
    nameKey: 'agents.agent3_name',
    roleKey: 'agents.agent3_role',
    icon: Compass,
    description: 'Identifies safe extraction corridors, evaluates topography, and calculates carry-out or helicopter hoist feasibility.',
    status: 'ONLINE'
  },
  {
    name: AgentName.EMERGENCY_COORDINATION,
    nameKey: 'agents.agent4_name',
    roleKey: 'agents.agent4_role',
    icon: ShieldAlert,
    description: 'Directly contacts and coordinates ITBP, mountain rescue squads, and regional volunteer rescue outposts.',
    status: 'ACTIVE'
  },
  {
    name: AgentName.COMMUNICATION,
    nameKey: 'agents.agent5_name',
    roleKey: 'agents.agent5_role',
    icon: MessageSquare,
    description: 'Generates concise, bilingual emergency SMS scripts and synthesized speech alerts for consented emergency contacts.',
    status: 'ONLINE'
  }
];

export default function AgentsPage() {
  const { t, formatDate } = useI18n();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const taskList = await dataProvider.getAgentTasks();
      setTasks(taskList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-orange-500" />
            {t('agents.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('agents.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">All 5 Agent Nodes Operational</span>
        </div>
      </div>

      {/* 5 Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AGENTS_DIRECTORY.map((agent) => {
          const Icon = agent.icon;
          const agentTasksCount = tasks.filter((taskItem) => taskItem.agent_name === agent.name).length;

          return (
            <div
              key={agent.name}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      {agent.status}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                      DEMO
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{t(agent.nameKey)}</h3>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">{t(agent.roleKey)}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{agent.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Executed Tasks: <strong className="text-slate-900 dark:text-white">{agentTasksCount}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0 Failures</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Agent Tasks Execution Log */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          {t('agents.task_log_title')}
        </h2>

        {error ? (
          <div className="rounded-xl border border-rose-300 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-6 text-center flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            <p className="text-xs text-slate-700 dark:text-slate-300">{error}</p>
            <button
              onClick={fetchTasks}
              className="mt-1 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs rounded transition"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No tasks currently queued.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {task.agent_name.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {task.task_type}
                      </span>
                      {task.is_demo && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                      {(task.output_data as any)?.summary || 'Task completed.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{task.status}</span>
                  <span className="mt-0.5 text-slate-500 dark:text-slate-400">
                    {formatDate(task.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
