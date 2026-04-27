/**
 * Global API client — all fetch calls go through here.
 * Base URL auto-detected from env or defaults to localhost:8000.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL   = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000/ws/live';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  // Supply Chain
  getCities:    ()                                   => request<any[]>('/api/cities'),
  getRoutes:    ()                                   => request<any[]>('/api/routes'),
  getRoute:     (id: string)                         => request<any>(`/api/routes/${id}`),
  getFleet:     ()                                   => request<any[]>('/api/fleet'),
  getShipments: ()                                   => request<any[]>('/api/shipments'),
  whatIf:       (route_id: string, failure_type: string) =>
    request<any>('/api/whatif', { method: 'POST', body: JSON.stringify({ route_id, failure_type }) }),

  // Risk & Alerts
  getRisk:   () => request<any[]>('/api/risk'),
  getAlerts: () => request<any[]>('/api/alerts'),

  // Analytics
  getAnalytics:   () => request<any>('/api/analytics'),
  getHealthIndex: () => request<any>('/api/health-index'),

  // AI Assistant
  queryAssistant:  (message: string, context?: string) =>
    request<any>('/api/assistant/query', { method: 'POST', body: JSON.stringify({ message, context }) }),
  getSuggestions:  () => request<any>('/api/assistant/suggestions'),

  // WebSocket
  wsUrl: WS_URL,
};
