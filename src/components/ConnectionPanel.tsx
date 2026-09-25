import { formatDateTime } from "@/lib/format";
import type { ConnectionOverview, SyncRun } from "@/lib/types";
import { Badge, statusTone } from "./Badge";

type StepState = "wait" | "run" | "done" | "fail";

const stateOf = (run: SyncRun | undefined): StepState => {
  if (!run) return "wait";
  if (run.status === "RUNNING") return "run";
  return run.status === "FAILED" ? "fail" : "done";
};

function Step({
  label,
  state,
  detail,
}: {
  label: string;
  state: StepState;
  detail?: string;
}) {
  const dot = {
    wait: "bg-zinc-200 text-zinc-500 dark:bg-zinc-800",
    run: "animate-pulse bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    fail: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  }[state];
  const mark = { wait: "", run: "…", done: "✓", fail: "!" }[state];
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${dot}`}
      >
        {mark}
      </span>
      <span>
        {label}
        {detail && <span className="text-zinc-500"> · {detail}</span>}
      </span>
    </li>
  );
}

const detailOf = (run: SyncRun | undefined) =>
  run && run.status !== "RUNNING"
    ? `${run.fetched} read, ${run.saved} new or changed${run.failed ? `, ${run.failed} failed` : ""}`
    : undefined;

interface ConnectionPanelProps {
  connection: ConnectionOverview | null;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  problem?: string;
}

export function ConnectionPanel({
  connection,
  onConnect,
  onSync,
  onDisconnect,
  problem,
}: ConnectionPanelProps) {
  const property = connection?.lastRuns.find(
    (run) => run.entity === "PROPERTY",
  );
  const reservation = connection?.lastRuns.find(
    (run) => run.entity === "RESERVATION",
  );
  const propertiesDone = !!property && property.status !== "RUNNING";
  const allDone =
    propertiesDone && !!reservation && reservation.status !== "RUNNING";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            iD
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">iDoBooking</h2>
            {connection ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <Badge tone={statusTone(connection.status)}>
                  {connection.status}
                </Badge>
                <span>{connection.label ?? connection.account}</span>
                {connection.lastSyncedAt && (
                  <span>
                    · last synced {formatDateTime(connection.lastSyncedAt)}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                Bring your properties and reservations into GCP.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {connection ? (
            <>
              <button
                onClick={onSync}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
              >
                Sync now
              </button>
              <button
                onClick={onDisconnect}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-red-700 dark:border-zinc-700 dark:text-red-400"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sync with GPC
            </button>
          )}
        </div>
      </div>

      {problem && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {problem}
        </p>
      )}

      {connection && (
        <>
          <ol className="mt-4 space-y-2">
            <Step label="Login checked and stored securely" state="done" />
            <Step
              label="Import properties"
              state={property ? stateOf(property) : "run"}
              detail={detailOf(property)}
            />
            <Step
              label="Import reservations"
              state={
                propertiesDone
                  ? reservation
                    ? stateOf(reservation)
                    : "run"
                  : "wait"
              }
              detail={detailOf(reservation)}
            />
          </ol>
          {allDone && connection.status === "CONNECTED" && (
            <p className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              All set. {connection.imported.properties} properties and{" "}
              {connection.imported.reservations} reservations are in GPC.
            </p>
          )}
          {(connection.status === "FAILED" ||
            connection.status === "TIMEOUT") && (
            <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
              The last read failed. Use &quot;Sync now&quot; to try again.
            </p>
          )}
        </>
      )}
    </section>
  );
}
