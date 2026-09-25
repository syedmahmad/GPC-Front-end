"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export interface LogEntry {
  id: number;
  method: string;
  path: string;
  status: number;
  ms: number;
  request?: unknown;
  response: unknown;
}

export interface ApiResult<T> {
  status: number;
  ok: boolean;
  body: T;
}

interface ApiContextValue {
  entries: LogEntry[];
  call: <T>(method: string, path: string, body?: unknown) => Promise<ApiResult<T>>;
}

const ApiContext = createContext<ApiContextValue | null>(null);
const MAX_ENTRIES = 40;

/** Never show the API key on screen, even in the activity log. */
function masked(body: unknown): unknown {
  if (body && typeof body === "object" && "apiKey" in body) {
    return { ...(body as Record<string, unknown>), apiKey: "••••••••" };
  }
  return body;
}

/**
 * Makes every call to GPC (through this app's own /api/gpc proxy) and keeps a
 * short log of them, so the screen can show exactly what a platform's server
 * would send and receive.
 */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const nextId = useRef(1);

  const call = useCallback(
    async <T,>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> => {
      const started = performance.now();
      let status = 0;
      let parsed: unknown = null;
      try {
        const response = await fetch(`/api/gpc${path}`, {
          method,
          headers: { "content-type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
        });
        status = response.status;
        const text = await response.text();
        parsed = text ? (JSON.parse(text) as unknown) : null;
      } catch {
        status = 0;
        parsed = { message: "Could not reach the demo server." };
      }
      const entry: LogEntry = {
        id: nextId.current++,
        method,
        path,
        status,
        ms: Math.round(performance.now() - started),
        request: masked(body),
        response: parsed,
      };
      setEntries((previous) => [entry, ...previous].slice(0, MAX_ENTRIES));
      return { status, ok: status >= 200 && status < 300, body: parsed as T };
    },
    [],
  );

  const value = useMemo(() => ({ entries, call }), [entries, call]);
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiContextValue {
  const value = useContext(ApiContext);
  if (!value) throw new Error("useApi must be used inside ApiProvider");
  return value;
}
