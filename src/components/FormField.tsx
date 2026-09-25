export const inputClass =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:bg-zinc-900";

/** A labelled form field with a Required/Optional tag, a hint, and an error line. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  badge,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Small note next to the label, e.g. "edited by you". */
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
          <span>
            {label}
            {required && <span className="ml-0.5 text-red-600" aria-hidden="true"> *</span>}
          </span>
          {badge}
        </label>
        {required !== undefined && (
          <span className={`text-xs font-medium ${required ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>
            {required ? "Required" : "Optional"}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
