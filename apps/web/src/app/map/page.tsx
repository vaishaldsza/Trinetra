export default function RescueMapPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rescue Map</h1>
          <p className="text-sm text-slate-400">Geographic tracking of hikers, active incidents, and medical facilities</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
          DEMO MAP VIEW
        </span>
      </div>

      <div className="h-[520px] rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-2xl font-black">
          📍
        </div>
        <div className="space-y-1 z-10">
          <h3 className="text-lg font-bold text-white">Interactive Rescue Map Module</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Leaflet GIS visualization displays hiker GPS traces, incident markers, and offline trail overlays.
          </p>
          <div className="text-xs text-slate-400 pt-2 font-mono">
            Active demo pin: Rohtang Pass Ridge (32.3716° N, 77.2466° E)
          </div>
        </div>

        {/* Mock map grid background */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      </div>
    </div>
  );
}
