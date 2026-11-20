'use client';

import dynamic from 'next/dynamic';
import { MapPin, Compass } from 'lucide-react';

// Dynamic import with SSR false is mandatory for Leaflet (window / document DOM access)
const RescueMap = dynamic(() => import('../../components/RescueMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] min-h-[500px] rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center gap-3">
      <Compass className="w-8 h-8 text-orange-500 animate-spin" />
      <span className="text-sm font-semibold text-slate-400">Loading Tactical Rescue Map...</span>
    </div>
  )
});

export default function MapPage() {
  return (
    <div className="flex flex-col gap-4 py-2 sm:py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-500" />
            Tactical Wilderness Rescue Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Realtime GIS tracking: active distress signals, hiker beacons, nearby hospitals, and SAR helipads.
          </p>
        </div>
      </div>

      {/* Interactive Map Component */}
      <RescueMap />
    </div>
  );
}
