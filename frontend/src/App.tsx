import { } from 'react';
import { useStore } from './store/supplyChainStore';
import { useWebSocket } from './hooks/useWebSocket';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ToastAlerts from './components/notifications/ToastAlerts';
import LiveMapView from './components/map/LiveMapView';
import RiskPage from './pages/RiskPage';
import RoutesPage from './pages/RoutesPage';
import ShipmentsPage from './pages/ShipmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AssistantPage from './pages/AssistantPage';
import './styles/globals.css';
import './App.css';

const PAGE_MAP: Record<string, JSX.Element> = {
  map:       <LiveMapView />,
  risk:      <RiskPage />,
  routes:    <RoutesPage />,
  shipments: <ShipmentsPage />,
  analytics: <AnalyticsPage />,
  assistant: <AssistantPage />,
};

export default function App() {
  const activePage = useStore(s => s.activePage);

  // Connect WebSocket — feeds global store
  useWebSocket();

  return (
    <div className="app-shell">
      {/* Ambient background orbs */}
      <div className="bg-orb bg-orb-blue" />
      <div className="bg-orb bg-orb-purple" />
      <div className="noise-overlay" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="app-main">
        <TopBar />

        {/* Page content */}
        <main className="app-content">
          {PAGE_MAP[activePage] ?? PAGE_MAP.map}
        </main>

        {/* Alert status bar */}
        <StatusBar />
      </div>

      {/* Toast notifications */}
      <ToastAlerts />
    </div>
  );
}

function StatusBar() {
  const { alerts, lastUpdate, routes } = useStore();
  const disrupted = routes.filter(r => r.is_disrupted).length;

  const ticker = [
    `${disrupted} disrupted routes`,
    ...alerts.slice(0, 3).map(a => a.title),
  ].join('  •  ');

  return (
    <footer className="status-bar">
      <div className="status-ticker-wrap">
        <span className="status-ticker-label">⚡ LIVE:</span>
        <div className="status-ticker">
          <span className="status-ticker-text">{ticker}</span>
        </div>
      </div>
      <div className="status-right">
        <span className="status-time">
          {lastUpdate?.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
        </span>
        <span className="status-version">SSCIP v1.0</span>
      </div>
    </footer>
  );
}
