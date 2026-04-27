import { useStore } from '../../store/supplyChainStore';
import {
  Map, AlertTriangle, Navigation2, Package,
  BarChart2, Bot, Activity, Zap, TrendingUp
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'map',       label: 'Live Map',        icon: Map,         color: 'blue' },
  { id: 'risk',      label: 'Risk Intelligence', icon: AlertTriangle, color: 'red' },
  { id: 'routes',    label: 'Route Optimizer', icon: Navigation2, color: 'yellow' },
  { id: 'shipments', label: 'Shipments',       icon: Package,     color: 'purple' },
  { id: 'analytics', label: 'Analytics',       icon: BarChart2,   color: 'green' },
  { id: 'assistant', label: 'AI Assistant',    icon: Bot,         color: 'blue' },
];

export default function Sidebar() {
  const { activePage, setActivePage, routes, alerts, isConnected } = useStore();

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.is_read).length;
  const disruptedRoutes = routes.filter(r => r.is_disrupted).length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={20} />
        </div>
        <div className="logo-text">
          <span className="logo-title">SSCIP</span>
          <span className="logo-sub">Supply Chain AI</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Connection Status */}
      <div className="sidebar-connection">
        <span className={`pulse-dot ${isConnected ? 'green' : 'red'}`} />
        <span className="connection-label">
          {isConnected ? 'Live Feed Active' : 'Reconnecting...'}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="sidebar-stats">
        <div className="stat-pill">
          <Activity size={12} />
          <span>{routes.filter(r => r.is_active).length} routes</span>
        </div>
        {disruptedRoutes > 0 && (
          <div className="stat-pill stat-pill-danger">
            <AlertTriangle size={12} />
            <span>{disruptedRoutes} disrupted</span>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`nav-item ${activePage === id ? 'active' : ''} nav-color-${color}`}
            onClick={() => setActivePage(id)}
          >
            <div className="nav-icon-wrap">
              <Icon size={18} />
            </div>
            <span className="nav-label">{label}</span>
            {id === 'risk' && criticalAlerts > 0 && (
              <span className="nav-badge">{criticalAlerts}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      {/* Bottom branding */}
      <div className="sidebar-footer">
        <TrendingUp size={12} />
        <span>Powered by AI Engine v2.4</span>
      </div>
    </aside>
  );
}
