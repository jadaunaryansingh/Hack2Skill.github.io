/**
 * useWebSocket — connects to /ws/live, feeds global Zustand store.
 *
 * StrictMode-safe:
 *  - Zustand selectors pulled at hook level (not inside useEffect callbacks)
 *  - 50ms startup delay so StrictMode's synchronous cleanup fires first
 *  - `destroyedRef` prevents reconnect loops after unmount
 */
import { useEffect, useRef } from 'react';
import { useStore } from '../store/supplyChainStore';
import { api } from '../api/client';

const RECONNECT_MS = 3000;
const BOOT_DELAY   = 50;

export function useWebSocket() {
  // ✅ Selectors at hook top-level — safe for Rules of Hooks
  const setLiveData  = useStore(s => s.setLiveData);
  const setConnected = useStore(s => s.setConnected);

  // Stable refs so the effect closure always has the latest values
  const setLiveRef  = useRef(setLiveData);
  const setConnRef  = useRef(setConnected);
  useEffect(() => { setLiveRef.current  = setLiveData;  }, [setLiveData]);
  useEffect(() => { setConnRef.current = setConnected; }, [setConnected]);

  useEffect(() => {
    let ws:       WebSocket | null = null;
    let timer:    ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function clearTimer() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    }

    function scheduleReconnect() {
      clearTimer();
      if (!destroyed) timer = setTimeout(connect, RECONNECT_MS);
    }

    function connect() {
      if (destroyed) return;

      // Close any lingering socket without triggering reconnect
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.onclose = null;
        ws.close();
      }

      try { ws = new WebSocket(api.wsUrl); }
      catch { scheduleReconnect(); return; }

      ws.onopen = () => {
        if (destroyed) { ws?.close(); return; }
        setConnRef.current(true);
        clearTimer();
      };

      ws.onmessage = ({ data }) => {
        if (destroyed) return;
        try {
          const d = JSON.parse(data);
          setLiveRef.current({
            routes:      d.routes       ?? [],
            fleet:       d.fleet        ?? [],
            shipments:   d.shipments    ?? [],
            analytics:   d.analytics    ?? null,
            healthIndex: d.health_index ?? null,
            alerts:      d.alerts       ?? [],
          });
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        setConnRef.current(false);
        scheduleReconnect();
      };

      ws.onerror = () => { /* onerror always followed by onclose */ };
    }

    // Small delay — lets StrictMode's immediate cleanup run first
    timer = setTimeout(connect, BOOT_DELAY);

    return () => {
      destroyed = true;
      clearTimer();
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        ws = null;
      }
      setConnRef.current(false);
    };
  }, []); // intentionally empty — run once per real mount
}
