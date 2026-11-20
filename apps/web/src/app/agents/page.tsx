export default function AgentsPage() {
  const agents = [
    { name: 'Location Intelligence Agent', role: 'Geographic context & hospital routing', status: 'ACTIVE (DEMO)' },
    { name: 'Medical Intelligence Agent', role: 'Triage assessment rule-checking & warning flags', status: 'ACTIVE (DEMO)' },
    { name: 'Route Intelligence Agent', role: 'Trail accessibility & extraction routes', status: 'IDLE (DEMO)' },
    { name: 'Emergency Coordination Agent', role: 'Workflow escalation & timeline tracking', status: 'ACTIVE (DEMO)' },
    { name: 'Communication Agent', role: 'Twilio SMS & voice call coordination', status: 'IDLE (DEMO)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Intelligence</h1>
          <p className="text-sm text-slate-400">Fetch.ai Agentverse specialized multi-agent coordination</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          5 AGENTS REGISTERED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm">{agent.name}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                {agent.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">{agent.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
