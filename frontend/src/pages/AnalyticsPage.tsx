import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useStore } from '../store/supplyChainStore';
import { BarChart2, TrendingUp, TrendingDown, Clock, Percent, DollarSign, Activity } from 'lucide-react';
import './AnalyticsPage.css';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip glass-card">
      <div className="tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="tooltip-value" style={{ color: p.color }}>{p.value.toFixed(1)}</div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { analytics, healthIndex } = useStore();

  if (!analytics) {
    return <div className="analytics-loading">Fetching analytics data...</div>;
  }

  const {
    avg_delay_minutes, on_time_percent, total_shipments,
    active_routes, disrupted_routes, avg_cost_variance,
    delay_series, efficiency_series, cost_series
  } = analytics;

  const kpis = [
    { label: 'Avg Delay',     value: `${avg_delay_minutes.toFixed(0)} min`, icon: Clock,       color: avg_delay_minutes > 60 ? 'var(--neon-red)' : 'var(--neon-yellow)', trend: avg_delay_minutes > 60 ? 'up' : 'down' },
    { label: 'On-Time %',     value: `${on_time_percent.toFixed(1)}%`,      icon: Percent,     color: on_time_percent > 80 ? 'var(--neon-green)' : 'var(--neon-yellow)', trend: 'up' },
    { label: 'Active Routes', value: active_routes,                          icon: Activity,    color: 'var(--neon-blue)', trend: 'stable' },
    { label: 'Disruptions',   value: disrupted_routes,                       icon: TrendingDown, color: 'var(--neon-red)', trend: disrupted_routes > 3 ? 'up' : 'down' },
    { label: 'Total Loads',   value: total_shipments,                        icon: BarChart2,   color: 'var(--neon-purple)', trend: 'up' },
    { label: 'Cost Variance', value: `${avg_cost_variance > 0 ? '+' : ''}${avg_cost_variance.toFixed(1)}%`, icon: DollarSign, color: avg_cost_variance > 10 ? 'var(--neon-red)' : 'var(--neon-green)', trend: avg_cost_variance > 0 ? 'up' : 'down' },
  ];

  const hComponents = healthIndex?.components ?? {};

  return (
    <div className="analytics-page scroll-y">
      {/* KPI Grid */}
      <div className="analytics-kpi-grid">
        {kpis.map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="analytics-kpi glass-card">
            <div className="akpi-top">
              <div className="akpi-icon" style={{ background: `${color}18`, color }}><Icon size={16} /></div>
              {trend === 'up' ? <TrendingUp size={14} color="var(--neon-red)" /> :
               trend === 'down' ? <TrendingDown size={14} color="var(--neon-green)" /> :
               <span style={{ width: 14 }} />}
            </div>
            <div className="akpi-value" style={{ color }}>{value}</div>
            <div className="akpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Delay Trend */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Average Delay Trend</span>
            <span className="chart-unit">minutes</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={delay_series} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF3366" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF3366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#FF3366" strokeWidth={2} fill="url(#delayGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency Trend */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Route Efficiency</span>
            <span className="chart-unit">score / 100</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={efficiency_series} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#00FF88" strokeWidth={2} dot={false}
                style={{ filter: 'drop-shadow(0 0 6px #00FF88)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Index */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Cost Index</span>
            <span className="chart-unit">baseline = 100</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cost_series} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#A855F7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="url(#costGrad)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Index Breakdown */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Health Index Breakdown</span>
            <span className="chart-unit" style={{ color: healthIndex?.score > 70 ? 'var(--neon-green)' : 'var(--neon-yellow)' }}>
              {healthIndex?.score.toFixed(0)}/100 — {healthIndex?.grade}
            </span>
          </div>
          <div className="health-breakdown">
            {Object.entries(hComponents).map(([key, val]) => {
              const v = val as number;
              const color = v > 75 ? 'var(--neon-green)' : v > 50 ? 'var(--neon-yellow)' : 'var(--neon-red)';
              return (
                <div key={key} className="hb-row">
                  <span className="hb-label">{key}</span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${v}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                  </div>
                  <span className="hb-value" style={{ color }}>{v.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
