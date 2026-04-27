import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/supplyChainStore';
import type { Route, Vehicle } from '../../store/supplyChainStore';
import './LiveMapView.css';

// ─── Dark map tile (CartoDB Dark Matter) ─────────────────────────────────────
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Center on India
const INDIA_CENTER: [number, number] = [22.5, 80.5];

// ─── Custom SVG truck icon ────────────────────────────────────────────────────
function makeTruckIcon(color: string, heading: number) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <g transform="rotate(${heading}, 14, 14)">
        <circle cx="14" cy="14" r="12" fill="${color}22" stroke="${color}" stroke-width="1.5"/>
        <polygon points="14,6 20,20 14,16 8,20" fill="${color}"/>
      </g>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'truck-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ─── City hub icon ────────────────────────────────────────────────────────────
function makeCityIcon(tier: number) {
  const size = tier === 1 ? 12 : tier === 2 ? 9 : 7;
  const color = tier === 1 ? '#00D4FF' : tier === 2 ? '#A855F7' : '#FFE500';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size*3}" height="${size*3}" viewBox="0 0 ${size*3} ${size*3}">
      <circle cx="${size*1.5}" cy="${size*1.5}" r="${size}" fill="${color}33" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${size*1.5}" cy="${size*1.5}" r="${size*0.4}" fill="${color}"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size*3, size*3],
    iconAnchor: [size*1.5, size*1.5],
  });
}

// ─── Auto-fit map bounds ──────────────────────────────────────────────────────
function MapController() {
  const map = useMap();
  useEffect(() => {
    map.setView(INDIA_CENTER, 5);
  }, [map]);
  return null;
}

// ─── Route color logic ────────────────────────────────────────────────────────
function routeColor(r: Route) {
  if (r.is_disrupted)          return '#FF3366';
  if (r.risk_score > 50)       return '#FF8C00';
  if (r.composite_score > 75)  return '#00FF88';
  return '#00D4FF';
}

function routeWeight(r: Route) {
  return r.composite_score > 80 ? 3 : 2;
}

// ─── Main Map Component ───────────────────────────────────────────────────────
export default function LiveMapView() {
  const { routes, fleet, selectedRouteId, setSelectedRoute } = useStore();
  const [showFleet, setShowFleet] = useState(true);
  const [showDisruptions, setShowDisruptions] = useState(true);
  const [mapFilter, setMapFilter] = useState<'all' | 'disrupted' | 'optimal'>('all');

  // City data from routes
  const cities = [
    { id: 'DEL', name: 'Delhi',      lat: 28.6139, lng: 77.2090, tier: 1 },
    { id: 'MUM', name: 'Mumbai',     lat: 19.0760, lng: 72.8777, tier: 1 },
    { id: 'BLR', name: 'Bengaluru',  lat: 12.9716, lng: 77.5946, tier: 1 },
    { id: 'CHN', name: 'Chennai',    lat: 13.0827, lng: 80.2707, tier: 1 },
    { id: 'KOL', name: 'Kolkata',    lat: 22.5726, lng: 88.3639, tier: 1 },
    { id: 'HYD', name: 'Hyderabad',  lat: 17.3850, lng: 78.4867, tier: 2 },
    { id: 'PUN', name: 'Pune',       lat: 18.5204, lng: 73.8567, tier: 2 },
    { id: 'AHM', name: 'Ahmedabad',  lat: 23.0225, lng: 72.5714, tier: 2 },
    { id: 'JAI', name: 'Jaipur',     lat: 26.9124, lng: 75.7873, tier: 2 },
    { id: 'LKO', name: 'Lucknow',    lat: 26.8467, lng: 80.9462, tier: 2 },
    { id: 'SUR', name: 'Surat',      lat: 21.1702, lng: 72.8311, tier: 3 },
    { id: 'KOC', name: 'Kochi',      lat:  9.9312, lng: 76.2673, tier: 3 },
  ];

  const filteredRoutes = routes.filter(r => {
    if (mapFilter === 'disrupted') return r.is_disrupted;
    if (mapFilter === 'optimal')   return !r.is_disrupted && r.composite_score > 75;
    return true;
  });

  const vehicleColor = (v: Vehicle) =>
    v.status === 'ON_TIME'  ? '#00FF88' :
    v.status === 'DELAYED'  ? '#FF8C00' :
    v.status === 'REROUTED' ? '#A855F7' : '#888';

  return (
    <div className="map-wrapper">
      {/* Map Controls */}
      <div className="map-controls glass-card">
        <span className="map-ctrl-label">Filter:</span>
        {(['all', 'disrupted', 'optimal'] as const).map(f => (
          <button
            key={f}
            className={`map-filter-btn ${mapFilter === f ? 'active' : ''}`}
            onClick={() => setMapFilter(f)}
          >
            {f === 'all' ? 'All Routes' : f === 'disrupted' ? '🔴 Disrupted' : '🟢 Optimal'}
          </button>
        ))}
        <div className="map-ctrl-divider" />
        <button
          className={`map-filter-btn ${showFleet ? 'active' : ''}`}
          onClick={() => setShowFleet(v => !v)}
        >🚚 Fleet</button>
        <button
          className={`map-filter-btn ${showDisruptions ? 'active' : ''}`}
          onClick={() => setShowDisruptions(v => !v)}
        >⚠️ Alerts</button>
      </div>

      {/* Map Legend */}
      <div className="map-legend glass-card">
        <div className="legend-item"><span className="legend-dot" style={{ background: '#00FF88' }} />Optimal</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#FF8C00' }} />At Risk</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#FF3366' }} />Disrupted</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#00D4FF' }} />Normal</div>
      </div>

      {/* Route Stats */}
      <div className="map-stats glass-card">
        <div className="map-stat">
          <span className="map-stat-value" style={{ color: 'var(--neon-blue)' }}>{routes.length}</span>
          <span className="map-stat-label">Routes</span>
        </div>
        <div className="map-stat">
          <span className="map-stat-value" style={{ color: 'var(--neon-green)' }}>{fleet.length}</span>
          <span className="map-stat-label">Vehicles</span>
        </div>
        <div className="map-stat">
          <span className="map-stat-value" style={{ color: 'var(--neon-red)' }}>
            {routes.filter(r => r.is_disrupted).length}
          </span>
          <span className="map-stat-label">Disrupted</span>
        </div>
      </div>

      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        className="leaflet-map"
        zoomControl={false}
      >
        <TileLayer url={DARK_TILE} attribution={DARK_ATTR} />
        <MapController />

        {/* Route Polylines */}
        {filteredRoutes.map(route => {
          const positions: [number, number][] = route.waypoints.map(w => [w.lat, w.lng]);
          const color  = routeColor(route);
          const weight = routeWeight(route);
          const selected = route.id === selectedRouteId;

          return (
            <Polyline
              key={route.id}
              positions={positions}
              pathOptions={{
                color,
                weight: selected ? weight + 2 : weight,
                opacity: selected ? 1 : 0.7,
                dashArray: route.is_disrupted ? '8, 6' : undefined,
              }}
              eventHandlers={{ click: () => setSelectedRoute(route.id === selectedRouteId ? null : route.id) }}
            >
              <Popup className="map-popup">
                <div className="popup-content">
                  <div className="popup-title">{route.name}</div>
                  <div className="popup-row"><span>Risk Score</span><span style={{ color }}>{route.risk_score}/100</span></div>
                  <div className="popup-row"><span>Traffic</span><span>{route.traffic_level}</span></div>
                  <div className="popup-row"><span>ETA</span><span>{route.current_duration_h.toFixed(1)}h</span></div>
                  <div className="popup-row"><span>Delay Prob.</span><span>{(route.delay_probability * 100).toFixed(0)}%</span></div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Disruption Pulsing Nodes */}
        {showDisruptions && routes.filter(r => r.is_disrupted).map(route => {
          const wp = route.waypoints[Math.floor(route.waypoints.length / 2)];
          return (
            <CircleMarker
              key={`dis-${route.id}`}
              center={[wp.lat, wp.lng]}
              radius={14}
              pathOptions={{ color: '#FF3366', fillColor: '#FF3366', fillOpacity: 0.2, weight: 2 }}
            >
              <Popup className="map-popup">
                <div className="popup-content">
                  <div className="popup-title" style={{ color: '#FF3366' }}>⚠️ Disruption</div>
                  <div className="popup-text">{route.name}</div>
                  <div className="popup-text">Risk: {route.risk_score}/100</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* City Hub Markers */}
        {cities.map(city => (
          <Marker
            key={city.id}
            position={[city.lat, city.lng]}
            icon={makeCityIcon(city.tier)}
          >
            <Popup className="map-popup">
              <div className="popup-content">
                <div className="popup-title">{city.name}</div>
                <div className="popup-text">Tier {city.tier} Hub</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fleet Vehicles */}
        {showFleet && fleet.map(vehicle => (
          <Marker
            key={vehicle.id}
            position={[vehicle.current_lat, vehicle.current_lng]}
            icon={makeTruckIcon(vehicleColor(vehicle), vehicle.heading)}
          >
            <Popup className="map-popup">
              <div className="popup-content">
                <div className="popup-title">{vehicle.name}</div>
                <div className="popup-row"><span>Driver</span><span>{vehicle.driver}</span></div>
                <div className="popup-row"><span>Speed</span><span>{vehicle.speed_kmh} km/h</span></div>
                <div className="popup-row"><span>ETA</span><span>{vehicle.eta_minutes} min</span></div>
                <div className="popup-row"><span>Status</span>
                  <span style={{ color: vehicleColor(vehicle) }}>{vehicle.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Selected Route Detail Panel */}
      {selectedRouteId && (() => {
        const r = routes.find(rt => rt.id === selectedRouteId);
        if (!r) return null;
        return (
          <div className="route-detail-panel glass-card">
            <div className="rdp-header">
              <span className="rdp-title">{r.name}</span>
              <button className="rdp-close" onClick={() => setSelectedRoute(null)}>✕</button>
            </div>
            <div className="rdp-grid">
              <div className="rdp-item">
                <span className="rdp-label">Risk Score</span>
                <span className="rdp-value" style={{ color: r.risk_score > 65 ? 'var(--neon-red)' : r.risk_score > 40 ? 'var(--neon-orange)' : 'var(--neon-green)' }}>
                  {r.risk_score}/100
                </span>
              </div>
              <div className="rdp-item">
                <span className="rdp-label">Distance</span>
                <span className="rdp-value">{r.distance_km} km</span>
              </div>
              <div className="rdp-item">
                <span className="rdp-label">ETA</span>
                <span className="rdp-value">{r.current_duration_h.toFixed(1)}h</span>
              </div>
              <div className="rdp-item">
                <span className="rdp-label">Traffic</span>
                <span className="rdp-value">{r.traffic_level}</span>
              </div>
              <div className="rdp-item">
                <span className="rdp-label">Weather</span>
                <span className="rdp-value">{r.weather_severity}</span>
              </div>
              <div className="rdp-item">
                <span className="rdp-label">Efficiency</span>
                <span className="rdp-value" style={{ color: 'var(--neon-green)' }}>{r.cost_efficiency}/100</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
