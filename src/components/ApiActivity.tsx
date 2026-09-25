"use client";

import { useApi } from "@/lib/api-log";
import { Badge } from "./Badge";

const pretty = (value: unknown) =>
  value === null || value === undefined || value === "" ? "(empty)" : JSON.stringify(value, null, 2);

/** Every call the screen makes to GPC, as a platform's server would. */
export function ApiActivity() {
  const { entries } = useApi();
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-bold">API activity</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Each call this screen makes to GPC, as BoxBuy&apos;s server would. The API key is hidden.
      </p>
      <div className="mt-4 max-h-[70vh] space-y-2 overflow-auto">
        {entries.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">Nothing yet.</p>}
        {entries.map((entry) => (
          <details key={entry.id} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <summary className="flex cursor-pointer items-center gap-2 bg-zinc-100 px-3 py-2 text-xs dark:bg-zinc-800">
              <Badge tone={entry.status >= 200 && entry.status < 300 ? "green" : "red"}>{entry.status || "ERR"}</Badge>
              <code className="font-bold">{entry.method}</code>
              <span className="truncate">{entry.path}</span>
              <span className="ml-auto text-zinc-500">{entry.ms} ms</span>
            </summary>
            {entry.request !== undefined && (
              <>
                <p className="bg-zinc-900 px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Sent</p>
                <pre className="max-h-64 overflow-auto bg-zinc-900 px-3 pb-2 text-xs text-zinc-100">{pretty(entry.request)}</pre>
              </>
            )}
            <p className="bg-zinc-900 px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Received</p>
            <pre className="max-h-64 overflow-auto bg-zinc-900 px-3 pb-2 text-xs text-zinc-100">{pretty(entry.response)}</pre>
          </details>
        ))}
      </div>
    </aside>
  );
}
