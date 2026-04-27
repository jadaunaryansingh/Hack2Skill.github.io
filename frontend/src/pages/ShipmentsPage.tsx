import { useStore } from '../store/supplyChainStore';
import { Package, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import './ShipmentsPage.css';

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const STATUS_BADGE: Record<string, string> = {
  IN_TRANSIT: 'badge-blue',
  DELAYED:    'badge-red',
  REROUTED:   'badge-purple',
  DELIVERED:  'badge-green',
  AT_RISK:    'badge-orange',
};

const STATUS_ICON: Record<string, string> = {
  IN_TRANSIT: '🚚',
  DELAYED:    '⚠️',
  REROUTED:   '🔀',
  DELIVERED:  '✅',
  AT_RISK:    '🔴',
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: 'var(--neon-red)',
  HIGH:     'var(--neon-orange)',
  MEDIUM:   'var(--neon-yellow)',
  LOW:      'var(--text-muted)',
};

function formatINR(v: number) {
  if (v >= 1e7)  return `₹${(v/1e7).toFixed(1)}Cr`;
  if (v >= 1e5)  return `₹${(v/1e5).toFixed(1)}L`;
  return `₹${(v/1000).toFixed(0)}K`;
}

function etaLabel(minutes: number) {
  if (minutes < 0) return 'Overdue';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes/60)}h ${minutes%60}m`;
}

export default function ShipmentsPage() {
  const { shipments } = useStore();

  const sorted = [...shipments].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] -
                  PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER];
    if (pDiff !== 0) return pDiff;
    return b.urgency_score - a.urgency_score;
  });

  const total     = shipments.length;
  const delayed   = shipments.filter(s => s.status === 'DELAYED' || s.status === 'AT_RISK').length;
  const delivered = shipments.filter(s => s.status === 'DELIVERED').length;
  const critical  = shipments.filter(s => s.priority === 'CRITICAL').length;

  return (
    <div className="shipments-page">
      {/* KPI Row */}
      <div className="ship-kpi-row">
        {[
          { label: 'Total Shipments', value: total,     icon: Package,      color: 'var(--neon-blue)' },
          { label: 'Delayed / At Risk', value: delayed, icon: AlertTriangle, color: 'var(--neon-red)' },
          { label: 'Delivered',        value: delivered, icon: TrendingUp,   color: 'var(--neon-green)' },
          { label: 'Critical Priority', value: critical, icon: Clock,        color: 'var(--neon-yellow)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="ship-kpi glass-card">
            <div className="ship-kpi-icon" style={{ background: `${color}18`, color }}>
              <Icon size={18} />
            </div>
            <div>
              <div className="ship-kpi-value" style={{ color }}>{value}</div>
              <div className="ship-kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Shipment Table */}
      <div className="glass-card shipments-table-wrap">
        <div className="section-header" style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
          <div className="section-icon blue"><Package size={16} /></div>
          <div>
            <div className="section-title">Priority Shipment Queue</div>
            <div className="section-subtitle">Sorted by urgency × priority</div>
          </div>
        </div>

        <div className="shipments-table-container scroll-y">
          <table className="shipments-table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Cargo</th>
                <th>Route</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Delay</th>
                <th>Value</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const etaMs = new Date(s.estimated_arrival).getTime() - Date.now();
                const etaMin = Math.floor(etaMs / 60000);

                return (
                  <tr key={s.id} id={`shipment-row-${s.id}`} className={s.status === 'DELAYED' || s.status === 'AT_RISK' ? 'row-danger' : ''}>
                    <td>
                      <div className="ship-code">
                        <span className="ship-rank">#{i+1}</span>
                        <span className="mono-text">{s.tracking_code}</span>
                      </div>
                    </td>
                    <td><span className="ship-desc">{s.description}</span></td>
                    <td>
                      <div className="ship-route">
                        <span>{s.origin_name}</span>
                        <span className="route-arrow">→</span>
                        <span>{s.destination_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="priority-badge" style={{ color: PRIORITY_COLOR[s.priority], borderColor: `${PRIORITY_COLOR[s.priority]}40` }}>
                        {s.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status] || 'badge-blue'}`}>
                        {STATUS_ICON[s.status]} {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="ship-progress-wrap">
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className="progress-fill" style={{
                            width: `${s.progress * 100}%`,
                            background: s.status === 'DELAYED' ? 'var(--neon-red)' : 'linear-gradient(90deg, var(--neon-blue), var(--neon-green))'
                          }} />
                        </div>
                        <span className="ship-progress-pct">{(s.progress * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      {s.delay_minutes > 0
                        ? <span style={{ color: 'var(--neon-red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>+{s.delay_minutes}m</span>
                        : <span style={{ color: 'var(--neon-green)', fontSize: 12 }}>On time</span>
                      }
                    </td>
                    <td>
                      <span className="ship-value">{formatINR(s.value_inr)}</span>
                    </td>
                    <td>
                      <span className={`eta-badge ${etaMin < 30 ? 'eta-urgent' : ''}`}>{etaLabel(etaMin)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
