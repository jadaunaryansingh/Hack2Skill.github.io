import { useStore } from '../store/supplyChainStore';
import { AlertTriangle, Shield } from 'lucide-react';
import './RiskPage.css';


export default function RiskPage() {
  const { routes, alerts } = useStore();

  // Sort routes by risk score descending
  const riskRoutes = [...routes].sort((a, b) => b.risk_score - a.risk_score);
  const criticalCount  = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount   = alerts.filter(a => a.severity === 'WARNING').length;
  const avgRisk        = routes.length ? routes.reduce((s, r) => s + r.risk_score, 0) / routes.length : 0;

  const severityColor = (s: string) =>
    s === 'CRITICAL' ? 'var(--neon-red)' : s === 'WARNING' ? 'var(--neon-yellow)' : 'var(--neon-blue)';

  const severityBadge = (s: string) =>
    s === 'CRITICAL' ? 'badge-red' : s === 'WARNING' ? 'badge-yellow' : 'badge-blue';

  function timeAgo(ts: string) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  }

  return (
    <div className="risk-page">
      {/* KPI Row */}
      <div className="risk-kpi-row">
        <div className="risk-kpi glass-card">
          <div className="risk-kpi-icon" style={{ background: 'rgba(255,51,102,0.12)', color: 'var(--neon-red)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="risk-kpi-value" style={{ color: 'var(--neon-red)' }}>{criticalCount}</div>
            <div className="risk-kpi-label">Critical Alerts</div>
          </div>
        </div>
        <div className="risk-kpi glass-card">
          <div className="risk-kpi-icon" style={{ background: 'rgba(255,229,0,0.12)', color: 'var(--neon-yellow)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="risk-kpi-value" style={{ color: 'var(--neon-yellow)' }}>{warningCount}</div>
            <div className="risk-kpi-label">Warnings</div>
          </div>
        </div>
        <div className="risk-kpi glass-card">
          <div className="risk-kpi-icon" style={{ background: 'rgba(168,85,247,0.12)', color: 'var(--neon-purple)' }}>
            <Shield size={20} />
          </div>
          <div>
            <div className="risk-kpi-value" style={{ color: 'var(--neon-purple)' }}>{avgRisk.toFixed(0)}</div>
            <div className="risk-kpi-label">Avg Risk Score</div>
          </div>
        </div>
        <div className="risk-kpi glass-card">
          <div className="risk-kpi-icon" style={{ background: 'rgba(255,140,0,0.12)', color: 'var(--neon-orange)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="risk-kpi-value" style={{ color: 'var(--neon-orange)' }}>
              {routes.filter(r => r.is_disrupted).length}
            </div>
            <div className="risk-kpi-label">Disrupted Routes</div>
          </div>
        </div>
      </div>

      <div className="risk-main-grid">
        {/* Route Risk Panel */}
        <div className="glass-card risk-routes-panel">
          <div className="section-header">
            <div className="section-icon red"><AlertTriangle size={16} /></div>
            <div>
              <div className="section-title">Route Risk Scores</div>
              <div className="section-subtitle">AI-computed, updated live</div>
            </div>
          </div>

          <div className="risk-routes-list scroll-y">
            {riskRoutes.map(route => {
              const color =
                route.risk_score > 70 ? 'var(--neon-red)'    :
                route.risk_score > 45 ? 'var(--neon-orange)' :
                route.risk_score > 25 ? 'var(--neon-yellow)' : 'var(--neon-green)';

              return (
                <div key={route.id} className={`risk-route-item ${route.is_disrupted ? 'disrupted' : ''}`}>
                  <div className="risk-route-header">
                    <div className="risk-route-name">
                      {route.is_disrupted && <span className="disruption-indicator animate-pulse-warning" />}
                      {route.name}
                    </div>
                    <div className="risk-route-score" style={{ color }}>
                      {route.risk_score.toFixed(0)}<span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/100</span>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${route.risk_score}%`,
                      background: `linear-gradient(90deg, ${color}80, ${color})`,
                      boxShadow: `0 0 8px ${color}60`,
                    }} />
                  </div>
                  <div className="risk-route-meta">
                    <span className={`badge badge-${route.traffic_level === 'LOW' ? 'green' : route.traffic_level === 'MODERATE' ? 'yellow' : 'red'}`}>
                      {route.traffic_level} traffic
                    </span>
                    <span className="badge badge-blue">
                      {(route.delay_probability * 100).toFixed(0)}% delay risk
                    </span>
                    <span className={`badge ${route.is_disrupted ? 'badge-red' : 'badge-green'}`}>
                      {route.is_disrupted ? 'DISRUPTED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="glass-card risk-alerts-panel">
          <div className="section-header">
            <div className="section-icon yellow"><AlertTriangle size={16} /></div>
            <div>
              <div className="section-title">Live Alert Feed</div>
              <div className="section-subtitle">{alerts.length} active alerts</div>
            </div>
          </div>

          <div className="alerts-list scroll-y">
            {alerts.length === 0 ? (
              <div className="alerts-empty">
                <Shield size={32} />
                <span>No active alerts</span>
              </div>
            ) : alerts.map(alert => (
              <div key={alert.id} className={`alert-item ${!alert.is_read ? 'unread' : ''}`}
                   style={{ borderLeftColor: severityColor(alert.severity) }}>
                <div className="alert-header">
                  <span className={`badge ${severityBadge(alert.severity)}`}>{alert.severity}</span>
                  <span className="alert-time">{timeAgo(alert.timestamp)}</span>
                </div>
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
