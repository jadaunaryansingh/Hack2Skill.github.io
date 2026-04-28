import { useState } from 'react';
import { Navigation, Zap, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import './RoutePlannerPage.css';

const CITIES = [
  'Delhi','Mumbai','Bengaluru','Chennai','Kolkata',
  'Hyderabad','Pune','Ahmedabad','Jaipur','Lucknow','Surat','Kochi',
];

const PRIORITIES = [
  { id: 'NORMAL',   label: '🟢 Normal',   },
  { id: 'HIGH',     label: '🔵 High',     },
  { id: 'URGENT',   label: '🟠 Urgent',   },
  { id: 'CRITICAL', label: '🔴 Critical', },
];

const DISRUPTION_TYPES = [
  { id: 'ACCIDENT',          label: '🚧 Accident'   },
  { id: 'TRAFFIC_SPIKE',     label: '🚦 Traffic'    },
  { id: 'HEAVY_RAIN',        label: '🌧️ Rain'       },
  { id: 'ROAD_CLOSURE',      label: '⛔ Closure'    },
  { id: 'VEHICLE_BREAKDOWN', label: '🔧 Breakdown'  },
];

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

function riskColor(score: number) {
  if (score < 30) return 'var(--neon-green)';
  if (score < 55) return 'var(--neon-yellow)';
  if (score < 75) return 'var(--neon-orange)';
  return 'var(--neon-red)';
}

export default function RoutePlannerPage() {
  const [source,      setSource]      = useState('Mumbai');
  const [destination, setDestination] = useState('Delhi');
  const [priority,    setPriority]    = useState('NORMAL');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<any>(null);
  const [error,       setError]       = useState('');

  // Disruption state
  const [disrupting,     setDisrupting]     = useState(false);
  const [disruptRoute,   setDisruptRoute]   = useState('A');
  const [disruptType,    setDisruptType]    = useState('ACCIDENT');
  const [disruptResult,  setDisruptResult]  = useState<any>(null);

  async function handlePlan() {
    if (source === destination) { setError('Source and destination must differ.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setDisruptResult(null);
    try {
      const data = await api.planRoute(source, destination, priority);
      if (data.error) { setError(data.error); }
      else { setResult(data); }
    } catch {
      setError('Failed to reach backend. Is Render awake?');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisrupt(routeId: string) {
    setDisrupting(true);
    setDisruptRoute(routeId);
    setDisruptResult(null);
    try {
      const data = await api.reroute(routeId, disruptType);
      setDisruptResult(data);
    } catch {
      setError('Reroute request failed.');
    } finally {
      setDisrupting(false);
    }
  }

  return (
    <div className="planner-page">

      {/* ── Input card ── */}
      <div className="planner-input-card glass-card">
        <div className="planner-input-title">🗺️ Smart Route Planner</div>
        <div className="planner-input-sub">
          AI scores every corridor in real-time — traffic · weather · priority · reliability
        </div>

        <div className="planner-fields">
          {/* Source */}
          <div className="planner-field">
            <label className="planner-label">📍 Source City</label>
            <select className="planner-select" value={source} onChange={e => setSource(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Destination */}
          <div className="planner-field">
            <label className="planner-label">🏁 Destination City</label>
            <select className="planner-select" value={destination} onChange={e => setDestination(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Plan button */}
          <button className="planner-btn" onClick={handlePlan} disabled={loading}>
            {loading ? <RefreshCw size={16} className="spin" /> : <Navigation size={16} />}
            {loading ? 'Analysing...' : 'Plan Route'}
          </button>
        </div>

        {/* Priority */}
        <div style={{ marginTop: 'var(--space-3)' }}>
          <div className="planner-label" style={{ marginBottom: 8 }}>⚡ Shipment Priority</div>
          <div className="priority-pills">
            {PRIORITIES.map(p => (
              <button
                key={p.id}
                className={`priority-pill ${priority === p.id ? `active-${p.id}` : ''}`}
                onClick={() => setPriority(p.id)}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 'var(--space-3)', padding: '10px 14px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--neon-red)' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="planner-loading glass-card">
          <div className="planner-loading-spinner" />
          <div className="planner-loading-text">🧠 AI engine scoring corridors…</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Checking traffic · weather · reliability · ETA weights
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !result && (
        <div className="planner-empty glass-card">
          <div className="planner-empty-icon">🛣️</div>
          <div className="planner-empty-text">Select cities &amp; tap Plan Route</div>
          <div className="planner-empty-sub">
            AI will score 3 route alternatives using real-time traffic + weather data
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <>
          {/* AI Summary */}
          <div className="planner-summary">
            <span className="planner-summary-icon">🤖</span>
            <div>
              <div className="planner-summary-text">
                <strong>AI Recommendation:</strong> {result.summary}
              </div>
              <div className="planner-summary-text" style={{ marginTop: 4, fontSize: 12 }}>
                {result.ai_insight}
              </div>
            </div>
          </div>

          {/* Disruption type selector */}
          <div className="glass-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div className="planner-label" style={{ marginBottom: 8 }}>Simulate Disruption Type:</div>
            <div className="disrupt-type-row">
              {DISRUPTION_TYPES.map(d => (
                <button
                  key={d.id}
                  className={`disrupt-type-btn ${disruptType === d.id ? 'active' : ''}`}
                  onClick={() => setDisruptType(d.id)}
                >{d.label}</button>
              ))}
            </div>
          </div>

          {/* Route cards */}
          <div className="planner-routes-grid">
            {result.routes.map((route: any) => {
              const rc = riskColor(route.risk_score);
              const cs = route.composite_score;
              return (
                <div key={route.id} className={`route-card rank-${route.rank}`}>

                  {/* Header */}
                  <div className="route-card-header">
                    <span className="route-rank">{RANK_EMOJI[route.rank - 1]}</span>
                    <span className="route-card-name">{route.name}</span>
                    {route.rank === 1 && <span className="route-badge-best">BEST</span>}
                  </div>

                  {/* Composite score bar */}
                  <div className="route-score-row">
                    <span className="route-score-label">AI Score</span>
                    <div className="route-score-bar">
                      <div className="route-score-fill"
                        style={{ width: `${cs}%`, background: `linear-gradient(90deg, ${rc}88, ${rc})` }} />
                    </div>
                    <span className="route-score-val" style={{ color: rc }}>{cs.toFixed(0)}</span>
                  </div>

                  {/* Stats */}
                  <div className="route-stats">
                    <div className="route-stat">
                      <div className="route-stat-label">Distance</div>
                      <div className="route-stat-value">{route.distance_km} km</div>
                    </div>
                    <div className="route-stat">
                      <div className="route-stat-label">ETA</div>
                      <div className="route-stat-value" style={{ color: route.delay_h > 1 ? 'var(--neon-orange)' : 'var(--neon-green)' }}>
                        {route.current_h}h {route.delay_h > 0 && <span style={{ fontSize: 10, color: 'var(--neon-orange)' }}>+{route.delay_h}h delay</span>}
                      </div>
                    </div>
                    <div className="route-stat">
                      <div className="route-stat-label">Risk</div>
                      <div className="route-stat-value" style={{ color: rc }}>{route.risk_score}/100</div>
                    </div>
                    <div className="route-stat">
                      <div className="route-stat-label">Reliability</div>
                      <div className="route-stat-value" style={{ color: 'var(--neon-blue)' }}>{route.factors.reliability}%</div>
                    </div>
                  </div>

                  {/* Risk factors */}
                  <div className="route-factors">
                    <div className="route-factor">
                      <span className="route-factor-icon">{route.traffic.icon}</span>
                      <span className="route-factor-label">Traffic — {route.traffic.desc}</span>
                      <span className="route-factor-val" style={{ color: riskColor(route.factors.traffic_risk) }}>
                        {route.factors.traffic_risk.toFixed(0)}
                      </span>
                    </div>
                    <div className="route-factor">
                      <span className="route-factor-icon">{route.weather.icon}</span>
                      <span className="route-factor-label">Weather — {route.weather.desc}</span>
                      <span className="route-factor-val" style={{ color: riskColor(route.factors.weather_risk) }}>
                        {route.factors.weather_risk.toFixed(0)}
                      </span>
                    </div>
                    <div className="route-factor">
                      <span className="route-factor-icon">⏱️</span>
                      <span className="route-factor-label">ETA delay risk</span>
                      <span className="route-factor-val" style={{ color: riskColor(route.factors.eta_risk) }}>
                        {route.factors.eta_risk.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="route-reasoning">{route.reasoning}</div>

                  {/* Disrupt button */}
                  <button
                    className="disrupt-btn"
                    onClick={() => handleDisrupt(route.id)}
                    disabled={disrupting && disruptRoute === route.id}
                  >
                    {disrupting && disruptRoute === route.id
                      ? <><RefreshCw size={12} className="spin" /> Simulating...</>
                      : <><AlertTriangle size={12} /> Simulate Disruption<ChevronRight size={12}/></>
                    }
                  </button>
                </div>
              );
            })}
          </div>

          {/* Disruption result banner */}
          {disruptResult && (
            <div className="disruption-banner">
              <div className="disruption-banner-header">
                <AlertTriangle size={18} />
                {disruptResult.disruption.icon} Disruption Detected — Auto Rerouting Active
              </div>
              <div className="disruption-banner-body">
                <div className="disruption-detail">
                  <div style={{ fontWeight: 700, color: 'var(--neon-red)', marginBottom: 6 }}>
                    {disruptResult.disruption.icon} {disruptResult.disruption.description}
                  </div>
                  <div>Affected route: <strong>Route {disruptResult.disruption.affected_route}</strong></div>
                  <div>Estimated delay: <strong>+{disruptResult.disruption.estimated_delay_h}h</strong></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    {disruptResult.alert.message}
                  </div>
                </div>
                <div className="disruption-reroute">
                  <div className="disruption-reroute-title">
                    <Zap size={13} style={{ display:'inline', marginRight: 4 }} />
                    AI Rerouting Activated
                  </div>
                  <div><strong style={{ color:'var(--neon-green)' }}>{disruptResult.reroute.new_route_name}</strong></div>
                  <div style={{ marginTop: 4 }}>{disruptResult.reroute.reason}</div>
                  <div style={{ marginTop: 6, color:'var(--neon-green)', fontWeight: 700 }}>
                    ⏱ Saves {disruptResult.reroute.time_saved_h}h &nbsp;·&nbsp;
                    Confidence: {(disruptResult.reroute.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
