import { useEffect } from 'react';
import { useStore } from '../../store/supplyChainStore';
import { X, AlertTriangle, Info, Zap } from 'lucide-react';
import './ToastAlerts.css';

const ICONS: Record<string, any> = {
  CRITICAL: AlertTriangle,
  WARNING:  AlertTriangle,
  INFO:     Info,
};

const COLORS: Record<string, string> = {
  CRITICAL: 'var(--neon-red)',
  WARNING:  'var(--neon-yellow)',
  INFO:     'var(--neon-blue)',
};

export default function ToastAlerts() {
  const { toastAlerts, dismissToast } = useStore();

  // Auto-dismiss after 8s
  useEffect(() => {
    if (!toastAlerts.length) return;
    const timer = setTimeout(() => {
      dismissToast(toastAlerts[0].id);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toastAlerts, dismissToast]);

  return (
    <div className="toast-container">
      {toastAlerts.map(alert => {
        const Icon  = ICONS[alert.severity] || Info;
        const color = COLORS[alert.severity] || 'var(--neon-blue)';
        return (
          <div key={alert.id} className="toast-item glass" style={{ borderLeftColor: color }}>
            <div className="toast-icon" style={{ color }}>
              <Icon size={16} />
            </div>
            <div className="toast-body">
              <div className="toast-title">{alert.title}</div>
              <div className="toast-msg">{alert.message.slice(0, 100)}{alert.message.length > 100 ? '...' : ''}</div>
            </div>
            <button className="toast-close" onClick={() => dismissToast(alert.id)}>
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
