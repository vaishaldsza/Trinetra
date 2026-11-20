'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { dataProvider, HospitalPoint, RescueAccessPoint, HikerSummary } from '../lib/dataProvider';
import { IncidentWithRelations, IncidentPriority, IncidentStatus } from '@trinetra/shared';
import { MapPin, AlertTriangle, Cross, Shield, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Component to handle programmatic map center panning
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

// Custom DivIcons with Tailwind styling
function createIncidentIcon(priority: IncidentPriority, isResolved: boolean) {
  const color = isResolved ? 'bg-emerald-500' : priority === IncidentPriority.CRITICAL ? 'bg-red-500' : 'bg-orange-500';
  const pulse = !isResolved && priority === IncidentPriority.CRITICAL ? 'animate-ping' : '';

  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="${pulse} absolute inline-flex h-full w-full rounded-full ${color} opacity-60"></span>
        <div class="relative inline-flex items-center justify-center rounded-full h-7 w-7 ${color} text-white font-bold text-xs shadow-lg border-2 border-slate-900">
          !
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function createHikerIcon() {
  return L.divIcon({
    className: 'custom-hiker-marker',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 text-white border-2 border-slate-900 shadow-lg">
        <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function createHospitalIcon() {
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs border-2 border-slate-900 shadow-lg">
        +
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function createRescuePointIcon() {
  return L.divIcon({
    className: 'custom-rap-marker',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs border-2 border-slate-900 shadow-lg">
        H
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

export default function RescueMap() {
  const [incidents, setIncidents] = useState<IncidentWithRelations[]>([]);
  const [hikers, setHikers] = useState<HikerSummary[]>([]);
  const [hospitals, setHospitals] = useState<HospitalPoint[]>([]);
  const [rescuePoints, setRescuePoints] = useState<RescueAccessPoint[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([32.24, 77.18]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const loadMapData = async () => {
    const [incs, hks, hsps, raps] = await Promise.all([
      dataProvider.getIncidents({ demoOnly: 'ALL' }),
      dataProvider.getHikers(),
      dataProvider.getHospitals(),
      dataProvider.getRescueAccessPoints()
    ]);
    setIncidents(incs);
    setHikers(hks);
    setHospitals(hsps);
    setRescuePoints(raps);
  };

  useEffect(() => {
    loadMapData();

    // Subscribe to realtime updates for seamless live map marker movement
    const unsubscribe = dataProvider.subscribe(() => {
      loadMapData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectIncident = (inc: IncidentWithRelations) => {
    if (inc.latitude && inc.longitude) {
      setMapCenter([inc.latitude, inc.longitude]);
      setSelectedIncidentId(inc.id);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-180px)] min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col md:flex-row shadow-2xl">
      {/* Sidebar: Incident Telemetry Directory */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/90 backdrop-blur p-4 flex flex-col gap-4 overflow-y-auto max-h-[260px] md:max-h-full z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Tactical Map Overlays
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {incidents.length} Incidents
          </span>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Critical Distress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>High Priority SOS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Hiker Position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600" />
            <span>Hospital / Clinic</span>
          </div>
        </div>

        {/* Incidents Quick Focus List */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Focus Incident Location:
          </span>
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => handleSelectIncident(inc)}
              className={`text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                selectedIncidentId === inc.id
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">
                  {inc.profile?.full_name || 'Hiker'}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    inc.priority === IncidentPriority.CRITICAL ? 'bg-red-950 text-red-400' : 'bg-orange-950 text-orange-400'
                  }`}
                >
                  {inc.priority}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {(inc.hiking_session?.start_location as any)?.trail || 'Trail Area'} · {inc.detection_source}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <MapController center={mapCenter} />

          {/* CartoDB Dark Matter Tiles for crisp modern night tactical theme */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Incidents Markers */}
          {incidents.map((inc) => {
            if (!inc.latitude || !inc.longitude) return null;
            const isResolved = inc.status === IncidentStatus.RESOLVED;

            return (
              <Marker
                key={inc.id}
                position={[inc.latitude, inc.longitude]}
                icon={createIncidentIcon(inc.priority, isResolved)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 flex flex-col gap-1.5 text-xs text-slate-900 max-w-[220px]">
                    <div className="flex items-center justify-between font-bold">
                      <span>{inc.profile?.full_name || 'Hiker'}</span>
                      <span className="text-[10px] uppercase font-bold text-red-600">
                        {inc.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {inc.triage_assessment?.assessment_summary || 'Emergency SOS active.'}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      GPS: {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                    </div>
                    <Link
                      href={`/incidents/${inc.id}`}
                      className="mt-1 text-center py-1 rounded bg-orange-600 text-white font-bold text-[11px] hover:bg-orange-500 transition"
                    >
                      Inspect Incident Details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Hiker Positions */}
          {hikers.map((hiker) => (
            <Marker
              key={hiker.id}
              position={[hiker.latitude, hiker.longitude]}
              icon={createHikerIcon()}
            >
              <Popup>
                <div className="p-1 text-xs text-slate-900">
                  <span className="font-bold">{hiker.name}</span>
                  <div className="text-[10px] text-slate-500">Trail: {hiker.trailName}</div>
                  <div className="text-[10px] text-slate-500">Battery: {hiker.batteryPercent}%</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hospitals */}
          {hospitals.map((hosp) => (
            <Marker
              key={hosp.id}
              position={[hosp.latitude, hosp.longitude]}
              icon={createHospitalIcon()}
            >
              <Popup>
                <div className="p-1 text-xs text-slate-900">
                  <span className="font-bold">{hosp.name}</span>
                  <div className="text-[10px] text-blue-600 font-medium">Distance: {hosp.distanceKm} km</div>
                  <div className="text-[10px] text-slate-500">Phone: {hosp.phone}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Rescue Access Points */}
          {rescuePoints.map((rap) => (
            <Marker
              key={rap.id}
              position={[rap.latitude, rap.longitude]}
              icon={createRescuePointIcon()}
            >
              <Popup>
                <div className="p-1 text-xs text-slate-900">
                  <span className="font-bold">{rap.name}</span>
                  <div className="text-[10px] text-slate-600">Elev: {rap.elevationMeters}m</div>
                  <div className="text-[10px] text-slate-500">{rap.contactChannel}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
