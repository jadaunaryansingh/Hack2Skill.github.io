import { useStore } from '../../store/supplyChainStore';
import { Bell, Clock, TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react';
import './TopBar.css';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  map:       { title: 'Live Command Map',       subtitle: 'Real-time fleet & route monitoring' },
  risk:      { title: 'AI Risk Intelligence',   subtitle: 'Predictive disruption analysis' },
  routes:    { title: 'Route Optimizer',        subtitle: 'Smart rerouting engine' },
  shipments: { title: 'Shipment Tracker',       subtitle: 'Priority-sorted delivery queue' },
  analytics: { title: 'Analytics Dashboard',   subtitle: 'Performance metrics & trends' },
  assistant: { title: 'AI Strategy Assistant', subtitle: 'Intelligent logistics advisor' },
};

export default function TopBar() {
  const { activePage, healthIndex, lastUpdate, isConnected, alerts, setActivePage } = useStore();
  const { title, subtitle } = PAGE_TITLES[activePage] || PAGE_TITLES.map;

  const unread = alerts.filter(a => !a.is_read).length;
  const score  = healthIndex?.score ?? 0;
  const grade  = healthIndex?.grade ?? '—';
  const trend  = healthIndex?.trend ?? 'STABLE';

  const scoreColor =
    score >= 80 ? 'var(--neon-green)'  :
    score >= 60 ? 'var(--neon-yellow)' :
    score >= 40 ? 'var(--neon-orange)' :
    'var(--neon-red)';

  const TrendIcon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus;

  const timeStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <header className="topbar">
      {/* Page Title */}
      <div className="topbar-title-section">
        <h1 className="topbar-title">{title}</h1>
        <span className="topbar-subtitle">{subtitle}</span>
      </div>

      {/* Center spacer */}
      <div className="topbar-center">
        <div className="live-ticker">
          <span className="pulse-dot green" />
          <span className="ticker-text">LIVE DATA STREAM</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="topbar-right">

        {/* Health Index */}
        <div className="health-widget">
          <div className="health-gauge-wrap">
            <svg className="health-gauge" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle
                cx="30" cy="30" r="24"
                fill="none"
                stroke={scoreColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 150.8} 150.8`}
                transform="rotate(-90 30 30)"
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor})`, transition: 'stroke-dasharray 1s ease' }}
              />
              <text x="30" y="33" textAnchor="middle" fontSize="12" fontWeight="800" fill={scoreColor} fontFamily="Space Grotesk">
                {Math.round(score)}
              </text>
            </svg>
          </div>
          <div className="health-info">
            <span className="health-label">Health Index</span>
            <div className="health-grade" style={{ color: scoreColor }}>
              <TrendIcon size={12} />
              <span>{grade}</span>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className={`topbar-chip ${isConnected ? 'chip-connected' : 'chip-disconnected'}`}>
          {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isConnected ? 'Connected' : 'Offline'}</span>
        </div>

        {/* Last update */}
        <div className="topbar-chip chip-time">
          <Clock size={13} />
          <span>{timeStr}</span>
        </div>

        {/* Alert bell */}
        <button
          id="topbar-alerts-btn"
          className="topbar-bell"
          onClick={() => setActivePage('risk')}
        >
          <Bell size={18} />
          {unread > 0 && <span className="bell-badge">{unread}</span>}
        </button>
      </div>
    </header>
  );
}
