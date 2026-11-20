import Link from 'next/link';

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incident Management</h1>
          <p className="text-sm text-slate-400">Review and triage active and historical emergency incidents</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
          Total: 1 Incident (DEMO)
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-400">
            <tr>
              <th className="px-4 py-3">Incident ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Coordinates</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            <tr className="hover:bg-slate-800/40">
              <td className="px-4 py-3 font-mono text-xs">d000...0001 <span className="text-amber-400 font-bold">[DEMO]</span></td>
              <td className="px-4 py-3">Fall Detected</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-800 text-red-300">
                  CRITICAL
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 border border-orange-800 text-orange-300">
                  ASSISTANCE_REQUESTED
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">32.3716, 77.2466</td>
              <td className="px-4 py-3">
                <Link
                  href="/incidents/d0000000-0000-0000-0000-000000000001"
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline"
                >
                  View Details
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
