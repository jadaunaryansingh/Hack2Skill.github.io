/**
 * Zustand global store — holds all live supply chain state.
 * Updated by the WebSocket feed every 3 seconds.
 */

import { create } from 'zustand';

export interface Route {
  id: string; name: string; origin_id: string; destination_id: string;
  origin_name: string; destination_name: string; distance_km: number;
  base_duration_h: number; current_duration_h: number;
  waypoints: { lat: number; lng: number }[];
  risk_score: number; delay_probability: number; cost_efficiency: number;
  composite_score: number; traffic_level: string; weather_severity: string;
  is_active: boolean; is_disrupted: boolean;
}

export interface Vehicle {
  id: string; name: string; type: string; current_lat: number; current_lng: number;
  heading: number; speed_kmh: number; route_id: string; shipment_id: string;
  progress: number; status: string; eta_minutes: number; driver: string;
}

export interface Shipment {
  id: string; tracking_code: string; description: string;
  origin_name: string; destination_name: string; route_id: string; vehicle_id: string;
  status: string; priority: string; urgency_score: number; weight_kg: number;
  value_inr: number; departure_time: string; expected_arrival: string;
  estimated_arrival: string; delay_minutes: number; progress: number;
}

export interface Alert {
  id: string; severity: string; title: string; message: string;
  route_id: string | null; shipment_id: string | null; timestamp: string; is_read: boolean;
}

export interface HealthIndex {
  score: number; grade: string; trend: string; components: Record<string, number>;
}

export interface Analytics {
  avg_delay_minutes: number; on_time_percent: number; total_shipments: number;
  active_routes: number; disrupted_routes: number; avg_cost_variance: number;
  delay_series: { time: string; value: number }[];
  efficiency_series: { time: string; value: number }[];
  cost_series: { time: string; value: number }[];
  city_heatmap: Record<string, number>;
}

interface SupplyChainStore {
  // Data
  routes:      Route[];
  fleet:       Vehicle[];
  shipments:   Shipment[];
  alerts:      Alert[];
  analytics:   Analytics | null;
  healthIndex: HealthIndex | null;

  // UI State
  selectedRouteId:   string | null;
  selectedShipmentId: string | null;
  isConnected:       boolean;
  lastUpdate:        Date | null;
  activePage:        string;
  toastAlerts:       Alert[];

  // Actions
  setLiveData:         (data: Partial<SupplyChainStore>) => void;
  setConnected:        (v: boolean) => void;
  setSelectedRoute:    (id: string | null) => void;
  setSelectedShipment: (id: string | null) => void;
  setActivePage:       (page: string) => void;
  markAlertRead:       (id: string) => void;
  pushToast:           (alert: Alert) => void;
  dismissToast:        (id: string) => void;
}

export const useStore = create<SupplyChainStore>((set, get) => ({
  routes:      [],
  fleet:       [],
  shipments:   [],
  alerts:      [],
  analytics:   null,
  healthIndex: null,

  selectedRouteId:    null,
  selectedShipmentId: null,
  isConnected:        false,
  lastUpdate:         null,
  activePage:         'map',
  toastAlerts:        [],

  setLiveData: (data) => set((state) => {
    // Detect new critical alerts for toast notifications
    const newAlerts = (data.alerts || []).filter(
      (a: Alert) => !state.alerts.find(existing => existing.id === a.id) && a.severity === 'CRITICAL'
    );
    return {
      ...data,
      lastUpdate: new Date(),
      toastAlerts: [
        ...state.toastAlerts,
        ...newAlerts.slice(0, 2),
      ].slice(-5),
    };
  }),

  setConnected:        (v) => set({ isConnected: v }),
  setSelectedRoute:    (id) => set({ selectedRouteId: id }),
  setSelectedShipment: (id) => set({ selectedShipmentId: id }),
  setActivePage:       (page) => set({ activePage: page }),

  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, is_read: true } : a),
  })),

  pushToast: (alert) => set((state) => ({
    toastAlerts: [...state.toastAlerts, alert].slice(-5),
  })),

  dismissToast: (id) => set((state) => ({
    toastAlerts: state.toastAlerts.filter(a => a.id !== id),
  })),
}));
