"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/lib/api-log";
import { errorText } from "@/lib/format";
import type {
  ApiErrorBody,
  Connection,
  ConnectionOverview,
  ConnectInput,
  Page,
  Property,
  Reservation,
} from "@/lib/types";
import { ApiActivity } from "./ApiActivity";
import { ConnectForm, SubmitResult } from "./ConnectForm";
import { ConnectionPanel } from "./ConnectionPanel";
import { PropertiesTable } from "./PropertiesTable";
import { ReservationsTable } from "./ReservationsTable";

const POLL_MS = 1500;
const PAGE_LIMIT = 100;

type Tab = "properties" | "reservations";

export function Dashboard() {
  const { call } = useApi();
  const [connection, setConnection] = useState<ConnectionOverview | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totals, setTotals] = useState({ properties: 0, reservations: 0 });
  const [tab, setTab] = useState<Tab>("properties");
  const [formOpen, setFormOpen] = useState(false);
  const [watching, setWatching] = useState(false);
  const [problem, setProblem] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    const [p, r] = await Promise.all([
      call<Page<Property>>("GET", `/properties?limit=${PAGE_LIMIT}`),
      call<Page<Reservation>>("GET", `/reservations?limit=${PAGE_LIMIT}`),
    ]);
    setProperties(p.ok ? p.body.data : []);
    setReservations(r.ok ? r.body.data : []);
    setTotals({ properties: p.ok ? p.body.total : 0, reservations: r.ok ? r.body.total : 0 });
  }, [call]);

  const refreshConnection = useCallback(
    async (id: string): Promise<ConnectionOverview | null> => {
      const result = await call<ConnectionOverview>("GET", `/connections/${id}`);
      if (!result.ok) return null;
      setConnection(result.body);
      return result.body;
    },
    [call],
  );

  // On first load, pick up an existing connection so a refresh does not lose it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await call<{ data: Connection[] }>("GET", "/connections");
      if (cancelled) return;
      if (!list.ok) {
        setProblem(errorText(list.body as unknown as ApiErrorBody) || "Could not reach GPC. Is it running?");
        return;
      }
      const live = list.body.data.find((c) => c.status !== "DISCONNECTED");
      if (!live) return;
      const overview = await refreshConnection(live.id);
      if (!cancelled && overview) await loadData();
    })();
    return () => {
      cancelled = true;
    };
  }, [call, refreshConnection, loadData]);

  // While an import is running, check on it until both parts have finished.
  const connectionId = connection?.id;
  useEffect(() => {
    if (!watching || !connectionId) return;
    const timer = setInterval(async () => {
      const overview = await refreshConnection(connectionId);
      if (!overview) return;
      const finished = overview.lastRuns.length === 2 && overview.lastRuns.every((run) => run.status !== "RUNNING");
      if (finished || overview.status === "FAILED" || overview.status === "TIMEOUT") {
        setWatching(false);
        await loadData();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [watching, connectionId, refreshConnection, loadData]);

  async function connect(input: ConnectInput): Promise<SubmitResult> {
    const result = await call<{ connection: ConnectionOverview } & ApiErrorBody>("POST", "/connections/idobooking", input);
    if (!result.ok) {
      return { ok: false, message: errorText(result.body), reason: result.body.reason };
    }
    setProblem(undefined);
    setConnection(result.body.connection);
    setFormOpen(false);
    setWatching(true);
    return { ok: true };
  }

  async function syncNow() {
    if (!connection) return;
    const result = await call("POST", `/connections/${connection.id}/sync`);
    if (result.status === 202) {
      setConnection({ ...connection, lastRuns: connection.lastRuns.map((run) => ({ ...run, status: "RUNNING" })) });
      setWatching(true);
    }
  }

  async function disconnect() {
    if (!connection) return;
    if (!window.confirm("Disconnect iDoBooking? GPC forgets the login. Data already imported stays.")) return;
    await call("DELETE", `/connections/${connection.id}`);
    setWatching(false);
    setConnection(null);
    setProperties([]);
    setReservations([]);
    setTotals({ properties: 0, reservations: 0 });
  }

  const hasData = connection !== null && connection.status !== "DISCONNECTED";

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <div className="space-y-5">
        <ConnectionPanel
          connection={connection}
          problem={problem}
          onConnect={() => setFormOpen(true)}
          onSync={syncNow}
          onDisconnect={disconnect}
        />

        {hasData && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">What GPC holds for this partner</h2>
              <button onClick={loadData} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold dark:border-zinc-700">
                Refresh
              </button>
            </div>

            <div className="mt-4 flex gap-2" role="tablist">
              {(["properties", "reservations"] as const).map((name) => (
                <button
                  key={name}
                  role="tab"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize ${
                    tab === name
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "border border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {name} <span className="ml-1 text-xs opacity-70">{totals[name]}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === "properties" ? (
                <PropertiesTable properties={properties} />
              ) : (
                <ReservationsTable reservations={reservations} properties={properties} />
              )}
            </div>
          </section>
        )}
      </div>

      <ApiActivity />

      {formOpen && <ConnectForm onSubmit={connect} onCancel={() => setFormOpen(false)} />}
    </div>
  );
}
