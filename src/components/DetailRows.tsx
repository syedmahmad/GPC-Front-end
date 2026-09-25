import type { Info } from "./InfoTip";
import { InfoTip } from "./InfoTip";

export interface DetailRow {
  label: string;
  value: React.ReactNode;
  info?: Info;
  /** Shown as "edited by you" when the partner has set this value. */
  edited?: boolean;
}

/** A label/value list, each label with an info icon saying where the value comes from. */
export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-start gap-4 px-4 py-3 text-sm">
          <dt className="flex items-center gap-1.5 font-medium text-zinc-500">
            {row.label}
            {row.info && <InfoTip info={row.info} label={row.label} />}
          </dt>
          <dd className="min-w-0 break-words">
            {row.value === "" || row.value === null || row.value === undefined ? <span className="text-zinc-400">not set</span> : row.value}
            {row.edited && (
              <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                edited by you
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
