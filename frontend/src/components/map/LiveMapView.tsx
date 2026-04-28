/**
 * LiveMapView — Google Maps with Satellite View
 * Routes, fleet, disruptions all rendered via Google Maps overlays.
 */
import { useRef, useState, useCallback } from 'react';
import { GoogleMap, Polyline, Circle, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import type { Library } from '@react-google-maps/api';
import { useStore } from '../../store/supplyChainStore';
import type { Route, Vehicle } from '../../store/supplyChainStore';
import './LiveMapView.css';

// ─── City Hubs ────────────────────────────────────────────────────────────────
const CITIES = [
  { id: 'DEL', name: 'Delhi',     lat: 28.6139, lng: 77.2090, tier: 1 },
  { id: 'MUM', name: 'Mumbai',    lat: 19.0760, lng: 72.8777, tier: 1 },
  { id: 'BLR', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, tier: 1 },
  { id: 'CHN', name: 'Chennai',   lat: 13.0827, lng: 80.2707, tier: 1 },
  { id: 'KOL', name: 'Kolkata',   lat: 22.5726, lng: 88.3639, tier: 1 },
  { id: 'HYD', name: 'Hyderabad', lat: 17.3850, lng: 78.4867, tier: 2 },
  { id: 'PUN', name: 'Pune',      lat: 18.5204, lng: 73.8567, tier: 2 },
  { id: 'AHM', name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, tier: 2 },
  { id: 'JAI', name: 'Jaipur',    lat: 26.9124, lng: 75.7873, tier: 2 },
  { id: 'LKO', name: 'Lucknow',   lat: 26.8467, lng: 80.9462, tier: 2 },
  { id: 'SUR', name: 'Surat',     lat: 21.1702, lng: 72.8311, tier: 3 },
  { id: 'KOC', name: 'Kochi',     lat:  9.9312, lng: 76.2673, tier: 3 },
];

// ─── Color helpers ────────────────────────────────────────────────────────────
function routeColor(r: Route) {
  if (r.is_disrupted)         return '#FF3366';
  if (r.risk_score > 50)      return '#FF8C00';
  if (r.composite_score > 80) return '#00FF88';
  return '#00D4FF';
}

function vehicleColor(v: Vehicle) {
  return v.status === 'ON_TIME'  ? '#00FF88'
       : v.status === 'DELAYED'  ? '#FF8C00'
       : v.status === 'REROUTED' ? '#A855F7'
       : '#888888';
}

// ─── SVG city dot marker icon (Data URL for Google Maps) ──────────────────────
function cityIconSvg(tier: number, google: any) {
  const size  = tier === 1 ? 14 : tier === 2 ? 10 : 8;
  const color = tier === 1 ? '#00D4FF' : tier === 2 ? '#A855F7' : '#FFE500';
  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size+8}" height="${size+8}">
      <circle cx="${(size+8)/2}" cy="${(size+8)/2}" r="${size/2+2}"
        fill="${color}22" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${(size+8)/2}" cy="${(size+8)/2}" r="${size/2}"
        fill="${color}" opacity="0.9"/>
    </svg>`;
  const dataUrl = `data:image/svg+xml;base64,${btoa(svgStr)}`;
  return {
    url: dataUrl,
    scaledSize: new google.maps.Size(size + 8, size + 8),
    anchor: new google.maps.Point((size + 8) / 2, (size + 8) / 2),
  };
}

// ─── SVG vehicle arrow marker icon (Data URL for Google Maps) ────────────────
function vehicleIconSvg(v: Vehicle, google: any) {
  const color = vehicleColor(v);
  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
         style="transform:rotate(${v.heading}deg);overflow:visible">
      <polygon points="11,2 18,20 11,15 4,20"
        fill="${color}" stroke="#fff" stroke-width="1.2" opacity="0.95"/>
      <circle cx="11" cy="11" r="3" fill="${color}" opacity="0.4"/>
    </svg>`;
  const dataUrl = `data:image/svg+xml;base64,${btoa(svgStr)}`;
  return {
    url: dataUrl,
    scaledSize: new google.maps.Size(22, 22),
    anchor: new google.maps.Point(11, 11),
  };
}

// ─── Google Maps libraries (keep as constant to avoid recreation)
const LIBRARIES: Library[] = ['places', 'visualization'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveMapView() {
  const { routes, fleet, selectedRouteId, setSelectedRoute } = useStore();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'disrupted' | 'optimal'>('all');
  const [showFleet, setShowFleet] = useState(true);
  const [showDisrupt, setShowDisrupt] = useState(true);
  const [selectedRoute, setSelectedRouteState] = useState<Route | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{ type: 'city' | 'vehicle' | 'route'; data: any } | null>(null);
  const [infoWindowPos, setInfoWindowPos] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const mapOptions: google.maps.MapOptions = isLoaded ? {
    zoom: 5,
    center: { lat: 22.5, lng: 80.5 },
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    fullscreenControl: false,
    streetViewControl: false,
    rotateControl: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_RIGHT,
    },
    mapTypeControl: false,
    disableDefaultUI: true,
    gestureHandling: 'auto',
  } : {};

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="map-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00D4FF' }}>Loading Google Maps...</p>
      </div>
    );
  }

  const filtered = routes.filter(r => {
    if (mapFilter === 'disrupted') return r.is_disrupted;
    if (mapFilter === 'optimal')   return !r.is_disrupted && r.composite_score > 75;
    return true;
  });

  return (
    <div className="map-wrapper">
      {/* Filter / toggle controls */}
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
        <button className={`map-filter-btn ${showFleet ? 'active' : ''}`}
                onClick={() => setShowFleet(v => !v)}>🚚 Fleet</button>
        <button className={`map-filter-btn ${showDisrupt ? 'active' : ''}`}
                onClick={() => setShowDisrupt(v => !v)}>⚠️ Alerts</button>
      </div>

      {/* Legend */}
      <div className="map-legend glass-card">
        <div className="legend-item"><span className="legend-dot" style={{ background: '#00FF88' }} />Optimal</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#FF8C00' }} />At Risk</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#FF3366' }} />Disrupted</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#00D4FF' }} />Normal</div>
      </div>

      {/* Live Stats */}
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

      {/* Google Map */}
      <GoogleMap
        mapContainerClassName="google-map"
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {/* City Hub Markers */}
        {isLoaded && CITIES.map(city => (
          <Marker
            key={city.id}
            position={{ lat: city.lat, lng: city.lng }}
            icon={cityIconSvg(city.tier, window.google)}
            title={city.name}
            onClick={() => {
              setSelectedMarker({ type: 'city', data: city });
              setInfoWindowPos({ lat: city.lat, lng: city.lng });
            }}
          >
            {selectedMarker?.type === 'city' && selectedMarker?.data?.id === city.id && infoWindowPos && (
              <InfoWindow
                position={infoWindowPos}
                onCloseClick={() => {
                  setSelectedMarker(null);
                  setInfoWindowPos(null);
                }}
              >
                <div className="info-window-content">
                  <div className="info-window-title">{city.name}</div>
                  <div className="info-window-row">
                    <span>Hub Tier:</span>
                    <span>Tier {city.tier}</span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Route Polylines with Glow Effect */}
        {filtered.map(route => {
          const color = routeColor(route);
          const isSel = route.id === selectedRouteId;
          const path = route.waypoints.map(w => ({ lat: w.lat, lng: w.lng }));

          return (
            <div key={route.id}>
              {/* Glow halo */}
              <Polyline
                path={path}
                options={{
                  strokeColor: color,
                  strokeOpacity: 0.18,
                  strokeWeight: isSel ? 22 : 14,
                  clickable: false,
                }}
              />

              {/* Main line */}
              <Polyline
                path={path}
                options={{
                  strokeColor: color,
                  strokeOpacity: route.is_disrupted ? 0.9 : (isSel ? 1 : 0.85),
                  strokeWeight: isSel ? 4 : 2.5,
                  geodesic: true,
                  icons: route.is_disrupted
                    ? [
                        {
                          icon: {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 1,
                            scale: 4,
                          },
                          offset: '0',
                          repeat: '20px',
                        },
                      ]
                    : undefined,
                }}
                onClick={() => {
                  const newId = route.id === selectedRouteId ? null : route.id;
                  setSelectedRoute(newId);
                  setSelectedRouteState(newId ? route : null);
                }}
              />

              {/* Disruption circles */}
              {showDisrupt && route.is_disrupted && (
                <>
                  <Circle
                    center={{
                      lat: route.waypoints[Math.floor(route.waypoints.length / 2)].lat,
                      lng: route.waypoints[Math.floor(route.waypoints.length / 2)].lng,
                    }}
                    radius={35000}
                    options={{
                      strokeColor: '#FF3366',
                      strokeOpacity: 0.6,
                      strokeWeight: 2,
                      fillColor: '#FF3366',
                      fillOpacity: 0.08,
                      clickable: false,
                    }}
                  />
                  <Circle
                    center={{
                      lat: route.waypoints[Math.floor(route.waypoints.length / 2)].lat,
                      lng: route.waypoints[Math.floor(route.waypoints.length / 2)].lng,
                    }}
                    radius={18000}
                    options={{
                      strokeColor: '#FF3366',
                      strokeOpacity: 0.9,
                      strokeWeight: 1.5,
                      fillColor: '#FF3366',
                      fillOpacity: 0.15,
                      clickable: false,
                    }}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Vehicle Markers */}
        {isLoaded && showFleet && fleet.map(vehicle => (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.current_lat, lng: vehicle.current_lng }}
            icon={vehicleIconSvg(vehicle, window.google)}
            title={vehicle.name}
            onClick={() => {
              setSelectedMarker({ type: 'vehicle', data: vehicle });
              setInfoWindowPos({ lat: vehicle.current_lat, lng: vehicle.current_lng });
            }}
          >
            {selectedMarker?.type === 'vehicle' && selectedMarker?.data?.id === vehicle.id && infoWindowPos && (
              <InfoWindow
                position={infoWindowPos}
                onCloseClick={() => {
                  setSelectedMarker(null);
                  setInfoWindowPos(null);
                }}
              >
                <div className="info-window-content">
                  <div className="info-window-title">{vehicle.name}</div>
                  <div className="info-window-row">
                    <span>Driver:</span>
                    <span>{vehicle.driver}</span>
                  </div>
                  <div className="info-window-row">
                    <span>Speed:</span>
                    <span>{vehicle.speed_kmh} km/h</span>
                  </div>
                  <div className="info-window-row">
                    <span>ETA:</span>
                    <span>{vehicle.eta_minutes} min</span>
                  </div>
                  <div className="info-window-row">
                    <span>Progress:</span>
                    <span>{(vehicle.progress * 100).toFixed(0)}%</span>
                  </div>
                  <div className="info-window-row">
                    <span>Status:</span>
                    <span style={{ color: vehicleColor(vehicle), fontWeight: '700' }}>
                      {vehicle.status}
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      {/* Selected Route Detail Panel */}
      {selectedRoute && (
        <div className="route-detail-panel glass-card">
          <div className="rdp-header">
            <span className="rdp-title">{selectedRoute.name}</span>
            <button className="rdp-close"
              onClick={() => { setSelectedRoute(null); setSelectedRouteState(null); }}>✕</button>
          </div>
          <div className="rdp-grid">
            <div className="rdp-item">
              <span className="rdp-label">Risk</span>
              <span className="rdp-value" style={{
                color: selectedRoute.risk_score > 65 ? 'var(--neon-red)'
                     : selectedRoute.risk_score > 40 ? 'var(--neon-orange)'
                     : 'var(--neon-green)'
              }}>{selectedRoute.risk_score.toFixed(0)}/100</span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">Distance</span>
              <span className="rdp-value">{selectedRoute.distance_km} km</span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">ETA</span>
              <span className="rdp-value">{selectedRoute.current_duration_h.toFixed(1)}h</span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">Delay +</span>
              <span className="rdp-value" style={{ color: 'var(--neon-orange)' }}>
                {(selectedRoute.current_duration_h - selectedRoute.base_duration_h).toFixed(1)}h
              </span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">Traffic</span>
              <span className="rdp-value">{selectedRoute.traffic_level}</span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">Cost Eff.</span>
              <span className="rdp-value" style={{ color: 'var(--neon-green)' }}>{selectedRoute.cost_efficiency.toFixed(0)}/100</span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">Weather</span>
              <span className="rdp-value">{selectedRoute.weather_severity}</span>
            </div>
            <div className="rdp-item">
              <span className="rdp-label">Delay Prob.</span>
              <span className="rdp-value">{(selectedRoute.delay_probability * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <span className={`badge ${selectedRoute.is_disrupted ? 'badge-red' : 'badge-green'}`}>
              {selectedRoute.is_disrupted ? '⚠️ DISRUPTED' : '✅ ACTIVE'}
            </span>
            {selectedRoute.alternate_for && (
              <span className="badge badge-purple" style={{ marginLeft: 6 }}>
                🔀 REROUTED
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
