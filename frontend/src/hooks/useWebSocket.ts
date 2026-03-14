import { useEffect, useRef, useState, useCallback } from "react";
import { getWsUrl } from "@/lib/api";
import type { AgentLog } from "@/lib/types";

export function useWebSocket(jobId: string | undefined) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!jobId) return;
    const ws = new WebSocket(getWsUrl(jobId));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const log: AgentLog = JSON.parse(event.data);
        setLogs((prev) => {
          const idx = prev.findIndex((l) => l.agent_name === log.agent_name);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = log;
            return next;
          }
          return [...prev, log];
        });
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { logs, connected };
}
