import { useState } from 'react';
import { useStore } from '../store/supplyChainStore';
import { api } from '../api/client';
import { Navigation2, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import './RoutesPage.css';

const FAILURE_TYPES = ['CLOSURE', 'SEVERE_DELAY', 'WEATHER', 'ACCIDENT'] as const;

export default function RoutesPage() {
  const { routes, setSelectedRoute, selectedRouteId } = useStore();
  const [whatifRoute, setWhatifRoute]       = useState('');
  const [whatifType, setWhatifType]         = useState<typeof FAILURE_TYPES[number]>('CLOSURE');
  const [whatifResult, setWhatifResult]     = useState<any>(null);
  const [whatifLoading, setWhatifLoading]   = useState(false);
  const [autoReroute, setAutoReroute]       = useState(false);

  const sorted = [...routes].sort((a, b) => b.composite_score - a.composite_score);
  const optimal    = sorted.filter(r => !r.is_disrupted).slice(0, 6);
  const disrupted  = sorted.filter(r => r.is_disrupted);

  async function runWhatIf() {
    if (!whatifRoute) return;
    setWhatifLoading(true);
    setWhatifResult(null);
    try {
      const result = await api.whatIf(whatifRoute, whatifType);
      setWhatifResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setWhatifLoading(false);
    }
  }

  const scoreColor = (s: number) =>
    s > 75 ? 'var(--neon-green)' : s > 50 ? 'var(--neon-yellow)' : s > 30 ? 'var(--neon-orange)' : 'var(--neon-red)';

  return (
    <div className="routes-page scroll-y">
      {/* Auto-Reroute Toggle */}
      <div className="auto-reroute-bar glass-card">
        <div className="auto-reroute-info">
          <Zap size={16} color="var(--neon-yellow)" />
          <span className="auto-reroute-title">Smart Auto-Rerouting Engine</span>
          <span className="auto-reroute-sub">
            {autoReroute ? 'AI will automatically switch to optimal route when risk exceeds 65/100' : 'Enable to let AI auto-select routes'}
          </span>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={autoReroute} onChange={e => setAutoReroute(e.target.checked)} />
          <span className="toggle-track" />
        </label>
      </div>

      {/* Route Cards Grid */}
      <div className="routes-section">
        <div className="section-header">
          <div className="section-icon green"><Navigation2 size={16} /></div>
          <div>
            <div className="section-title">Optimal Routes</div>
            <div className="section-subtitle">Ranked by composite AI score</div>
          </div>
        </div>
        <div className="routes-grid">
          {optimal.map(route => (
            <div
              key={route.id}
              id={`route-card-${route.id}`}
              className={`route-card glass-card ${selectedRouteId === route.id ? 'selected' : ''}`}
              onClick={() => setSelectedRoute(selectedRouteId === route.id ? null : route.id)}
            >
              <div className="rc-header">
                <span className="rc-id">{route.id}</span>
                <div className="rc-score" style={{ color: scoreColor(route.composite_score) }}>
                  {route.composite_score.toFixed(0)}
                  <span className="rc-score-label">/100</span>
                </div>
              </div>
              <div className="rc-name">{route.name}</div>
              <div className="rc-metrics">
                <div className="rc-metric">
                  <span className="rc-metric-label">Risk</span>
                  <span className="rc-metric-value" style={{ color: scoreColor(100 - route.risk_score) }}>
                    {route.risk_score.toFixed(0)}
                  </span>
                </div>
                <div className="rc-metric">
                  <span className="rc-metric-label">ETA</span>
                  <span className="rc-metric-value">{route.current_duration_h.toFixed(1)}h</span>
                </div>
                <div className="rc-metric">
                  <span className="rc-metric-label">Cost Eff.</span>
                  <span className="rc-metric-value" style={{ color: scoreColor(route.cost_efficiency) }}>
                    {route.cost_efficiency.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="rc-footer">
                <span className={`badge badge-${route.traffic_level === 'LOW' ? 'green' : route.traffic_level === 'MODERATE' ? 'yellow' : 'red'}`}>
                  {route.traffic_level}
                </span>
                <span className="badge badge-blue">{route.weather_severity}</span>
                <span className="badge badge-green"><CheckCircle size={9} /> OPTIMAL</span>
              </div>
              {selectedRouteId === route.id && (
                <div className="rc-selected-indicator">Selected</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Disrupted Routes */}
      {disrupted.length > 0 && (
        <div className="routes-section">
          <div className="section-header">
            <div className="section-icon red"><AlertTriangle size={16} /></div>
            <div>
              <div className="section-title">Disrupted Routes</div>
              <div className="section-subtitle">{disrupted.length} routes need attention</div>
            </div>
          </div>
          <div className="routes-grid">
            {disrupted.map(route => (
              <div key={route.id} className="route-card route-card-disrupted glass-card">
                <div className="rc-header">
                  <span className="rc-id">{route.id}</span>
                  <div className="rc-score" style={{ color: 'var(--neon-red)' }}>
                    {route.risk_score.toFixed(0)}<span className="rc-score-label"> risk</span>
                  </div>
                </div>
                <div className="rc-name">{route.name}</div>
                <div className="rc-metrics">
                  <div className="rc-metric">
                    <span className="rc-metric-label">Delay Prob.</span>
                    <span className="rc-metric-value" style={{ color: 'var(--neon-red)' }}>
                      {(route.delay_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="rc-metric">
                    <span className="rc-metric-label">ETA</span>
                    <span className="rc-metric-value">{route.current_duration_h.toFixed(1)}h</span>
                  </div>
                  <div className="rc-metric">
                    <span className="rc-metric-label">vs Base</span>
                    <span className="rc-metric-value" style={{ color: 'var(--neon-red)' }}>
                      +{(route.current_duration_h - route.base_duration_h).toFixed(1)}h
                    </span>
                  </div>
                </div>
                <div className="rc-footer">
                  <span className="badge badge-red animate-pulse-warning">DISRUPTED</span>
                  <span className="badge badge-orange">{route.traffic_level} traffic</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What-If Simulator */}
      <div className="whatif-section glass-card">
        <div className="section-header">
          <div className="section-icon purple"><Zap size={16} /></div>
          <div>
            <div className="section-title">⚡ What-If Failure Simulator</div>
            <div className="section-subtitle">Simulate route failure & see cascading impact</div>
          </div>
        </div>

        <div className="whatif-controls">
          <select
            id="whatif-route-select"
            className="whatif-select"
            value={whatifRoute}
            onChange={e => setWhatifRoute(e.target.value)}
          >
            <option value="">— Select a route to simulate —</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.id}: {r.name}</option>)}
          </select>

          <select
            id="whatif-type-select"
            className="whatif-select"
            value={whatifType}
            onChange={e => setWhatifType(e.target.value as any)}
          >
            {FAILURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            id="whatif-run-btn"
            className="btn btn-danger"
            onClick={runWhatIf}
            disabled={!whatifRoute || whatifLoading}
          >
            {whatifLoading ? '⏳ Simulating...' : '🔴 Run Simulation'}
          </button>
        </div>

        {whatifResult && (
          <div className="whatif-result">
            <div className="whatif-result-grid">
              <div className="whatif-stat">
                <span className="whatif-stat-value" style={{ color: 'var(--neon-red)' }}>
                  {whatifResult.affected_shipments}
                </span>
                <span className="whatif-stat-label">Affected Shipments</span>
              </div>
              <div className="whatif-stat">
                <span className="whatif-stat-value" style={{ color: 'var(--neon-orange)' }}>
                  {whatifResult.estimated_delay_minutes} min
                </span>
                <span className="whatif-stat-label">Est. Delay</span>
              </div>
              <div className="whatif-stat">
                <span className="whatif-stat-value" style={{ color: 'var(--neon-yellow)' }}>
                  ₹{(whatifResult.cost_impact_inr / 100000).toFixed(1)}L
                </span>
                <span className="whatif-stat-label">Cost Impact</span>
              </div>
              <div className="whatif-stat">
                <span className="whatif-stat-value" style={{ color: 'var(--neon-purple)' }}>
                  +{whatifResult.risk_increase?.toFixed(0)}%
                </span>
                <span className="whatif-stat-label">Risk Increase</span>
              </div>
            </div>

            {whatifResult.recommended_reroutes?.length > 0 && (
              <div className="whatif-reroutes">
                <div className="whatif-reroutes-title">✅ AI Recommended Alternate Routes:</div>
                {whatifResult.recommended_reroutes.map((r: any) => (
                  <div key={r.id} className="whatif-reroute-item">
                    <span className="badge badge-green">{r.id}</span>
                    <span>{r.name}</span>
                    <span style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      Score: {r.composite_score}/100
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
