/**
 * WebSocket hook — connects to backend /ws/live and feeds global store.
 * Auto-reconnects on disconnect.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/supplyChainStore';
import { api } from '../api/client';

export function useWebSocket() {
  const wsRef      = useRef<WebSocket | null>(null);
  const timerRef   = useRef<number | null>(null);
  const setLiveData  = useStore(s => s.setLiveData);
  const setConnected = useStore(s => s.setConnected);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(api.wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveData({
          routes:      data.routes,
          fleet:       data.fleet,
          shipments:   data.shipments,
          analytics:   data.analytics,
          healthIndex: data.health_index,
          alerts:      data.alerts,
        });
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 seconds
      timerRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [setLiveData, setConnected]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [connect]);
}
