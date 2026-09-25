"use client";

import { useState } from "react";
import { Field, inputClass } from "./FormField";

export type FieldKind = "text" | "int" | "decimal" | "time" | "email" | "phone";

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  /** The name GPC uses in partnerEditedFields, to show "edited by you". */
  editedName?: string;
}

export interface FieldGroup {
  title: string;
  note?: string;
  fields: FieldSpec[];
}

/** The same rules the API enforces, so a mistake is caught before it is sent. */
function check(spec: FieldSpec, value: string, original: string): string | undefined {
  const text = value.trim();
  if (text === original.trim()) return undefined; // unchanged: nothing to check
  if (text === "") return "A value cannot be removed here. Type a new one, or put the old one back.";
  switch (spec.kind) {
    case "int": {
      if (!/^\d+$/.test(text)) return "Enter a whole number.";
      const n = Number(text);
      if (spec.min !== undefined && n < spec.min) return `Must be at least ${spec.min}.`;
      if (spec.max !== undefined && n > spec.max) return `Must be at most ${spec.max}.`;
      return undefined;
    }
    case "decimal": {
      if (!/^\d+([.,]\d{1,2})?$/.test(text)) return "Enter a number, with at most two decimals.";
      const n = Number(text.replace(",", "."));
      if (spec.min !== undefined && n < spec.min) return `Must be at least ${spec.min}.`;
      if (spec.max !== undefined && n > spec.max) return `Must be at most ${spec.max}.`;
      return undefined;
    }
    case "time":
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? undefined : "Use a 24-hour time like 15:00.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? undefined : "Enter a valid email address.";
    case "phone":
      return /^\+?[0-9 ()-]{5,30}$/.test(text) ? undefined : "Enter a phone number, for example +48 600 000 000.";
    default:
      return spec.maxLength && text.length > spec.maxLength ? `At most ${spec.maxLength} characters.` : undefined;
  }
}

export type Changes = Record<string, string | number>;

interface EditPanelProps {
  groups: FieldGroup[];
  /** Current values, as text. A missing value is an empty string. */
  initial: Record<string, string>;
  /** Fields the partner has already set, shown with an "edited by you" tag. */
  edited: string[];
  /** Saves the changes. Return an error message to show, or null when it worked. */
  onSave: (changes: Changes) => Promise<string | null>;
  onCancel: () => void;
}

/**
 * A form that only sends what the person actually changed. Nothing is saved
 * until they tick that they are sure: these values are kept as theirs and the
 * booking system's later updates will not overwrite them.
 */
export function EditPanel({ groups, initial, edited, onSave, onCancel }: EditPanelProps) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const specs = groups.flatMap((group) => group.fields);
  const errors: Record<string, string | undefined> = {};
  const changes: Changes = {};
  for (const spec of specs) {
    const value = values[spec.key] ?? "";
    const original = initial[spec.key] ?? "";
    errors[spec.key] = check(spec, value, original);
    if (value.trim() !== original.trim() && !errors[spec.key]) {
      const text = value.trim();
      changes[spec.key] = spec.kind === "int" ? Number(text) : spec.kind === "decimal" ? Number(text.replace(",", ".")) : text;
    }
  }
  const hasErrors = Object.values(errors).some(Boolean);
  const canSave = sure && !busy && !hasErrors && Object.keys(changes).length > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setFailure(null);
    const message = await onSave(changes);
    setBusy(false);
    if (message) setFailure(message);
  }

  return (
    <form onSubmit={submit} noValidate autoComplete="off">
      <p className="mb-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">
        Add what is missing or correct what is wrong. Only the fields you change are sent. What you save here is kept as
        yours, and later updates from iDoBooking will not overwrite it.
      </p>

      {groups.map((group) => (
        <fieldset key={group.title} className="mb-7">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{group.title}</legend>
          {group.note && <p className="mt-1 text-xs text-zinc-500">{group.note}</p>}
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {group.fields.map((spec) => {
              const error = errors[spec.key];
              const isEdited = spec.editedName ? edited.includes(spec.editedName) : false;
              return (
                <Field
                  key={spec.key}
                  id={spec.key}
                  label={spec.label}
                  hint={spec.hint}
                  error={error}
                  badge={
                    isEdited ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                        edited by you
                      </span>
                    ) : undefined
                  }
                >
                  <input
                    id={spec.key}
                    value={values[spec.key] ?? ""}
                    onChange={(event) => setValues({ ...values, [spec.key]: event.target.value })}
                    type={spec.kind === "time" ? "time" : spec.kind === "email" ? "email" : "text"}
                    inputMode={spec.kind === "int" ? "numeric" : spec.kind === "decimal" ? "decimal" : undefined}
                    maxLength={spec.maxLength}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${spec.key}-error` : undefined}
                    className={`${inputClass} ${error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"}`}
                  />
                </Field>
              );
            })}
          </div>
        </fieldset>
      ))}

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
        <input type="checkbox" checked={sure} onChange={(event) => setSure(event.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>
          <span className="font-semibold">I am sure these details are correct. *</span>
          <span className="block text-xs text-zinc-600 dark:text-zinc-400">
            They will be saved in GuestPortal Connect and shared with any system subscribed to changes.
          </span>
        </span>
      </label>

      {failure && (
        <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {failure}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : `Save ${Object.keys(changes).length || ""} change${Object.keys(changes).length === 1 ? "" : "s"}`.replace("  ", " ")}
        </button>
      </div>
      {!canSave && !busy && (
        <p className="mt-2 text-right text-xs text-zinc-500">
          {hasErrors ? "Fix the fields marked in red." : Object.keys(changes).length === 0 ? "Change at least one field." : "Tick the box to confirm."}
        </p>
      )}
    </form>
  );
}
