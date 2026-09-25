"use client";

import { useState } from "react";
import type { ConnectInput } from "@/lib/types";
import { Field, inputClass } from "./FormField";

export type SubmitResult = { ok: true } | { ok: false; message: string; reason?: string };

interface ConnectFormProps {
  onSubmit: (input: ConnectInput) => Promise<SubmitResult>;
  onCancel: () => void;
}

interface Values {
  apiUrl: string;
  applicationLogin: string;
  apiKey: string;
  label: string;
}

type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};

  const url = values.apiUrl.trim();
  if (!url) {
    errors.apiUrl = "The API address is required.";
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") errors.apiUrl = "The address must start with https://";
    } catch {
      errors.apiUrl = "Enter a full address, for example https://client1234.idobooking.com/api";
    }
  }
  if (url.length > 500) errors.apiUrl = "The address is too long (500 characters at most).";

  const login = values.applicationLogin.trim();
  if (!login) errors.applicationLogin = "The application login is required.";
  else if (login.length > 200) errors.applicationLogin = "Too long (200 characters at most).";

  const key = values.apiKey.trim();
  if (!key) errors.apiKey = "The API key is required.";
  else if (key.length > 500) errors.apiKey = "Too long (500 characters at most).";

  if (values.label.length > 200) errors.label = "Too long (200 characters at most).";
  return errors;
}


export function ConnectForm({ onSubmit, onCancel }: ConnectFormProps) {
  const [values, setValues] = useState<Values>({ apiUrl: "", applicationLogin: "", apiKey: "", label: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ message: string; reason?: string } | null>(null);

  const errors = validate(values);
  const valid = Object.keys(errors).length === 0;
  const shown = (name: keyof Values) => (touched[name] ? errors[name] : undefined);

  const bind = (name: keyof Values) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [name]: event.target.value }),
    onBlur: () => setTouched({ ...touched, [name]: true }),
    "aria-invalid": shown(name) ? true : undefined,
    "aria-describedby": shown(name) ? `${name}-error` : undefined,
    className: `${inputClass} ${shown(name) ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"}`,
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ apiUrl: true, applicationLogin: true, apiKey: true, label: true });
    if (!valid) return;
    setBusy(true);
    setFailure(null);
    const result = await onSubmit({
      apiUrl: values.apiUrl.trim(),
      applicationLogin: values.applicationLogin.trim(),
      apiKey: values.apiKey.trim(),
      ...(values.label.trim() ? { label: values.label.trim() } : {}),
    });
    setBusy(false);
    if (!result.ok) setFailure({ message: result.message, reason: result.reason });
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="connect-title">
      <form
        onSubmit={submit}
        noValidate
        autoComplete="off"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h2 id="connect-title" className="text-lg font-bold">Sync with GPC</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Enter the customer&apos;s iDoBooking API details. GPC checks them with iDoBooking before it keeps anything.
          Fields marked <span className="font-semibold text-red-600">*</span> are required.
        </p>

        <div className="mt-5 space-y-4">
          <Field id="apiUrl" label="iDoBooking API address" required hint="Example: https://client1234.idobooking.com/api. Must start with https://" error={shown("apiUrl")}>
            <input {...bind("apiUrl")} type="url" placeholder="https://client1234.idobooking.com/api" autoFocus />
          </Field>
          <Field id="applicationLogin" label="Application login" required hint="The API login name, for example ApiPartner_Example." error={shown("applicationLogin")}>
            <input {...bind("applicationLogin")} type="text" placeholder="ApiPartner_Example" />
          </Field>
          <Field id="apiKey" label="API key" required hint="Sent to GPC once and stored encrypted. It is never shown again." error={shown("apiKey")}>
            <div className="flex gap-2">
              <input {...bind("apiKey")} type={showKey ? "text" : "password"} autoComplete="new-password" />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="rounded-lg border border-zinc-300 px-3 text-xs font-semibold dark:border-zinc-700"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          <Field id="label" label="Name for this connection" hint="Only to recognise it later, for example the hotel's name." error={shown("label")}>
            <input {...bind("label")} type="text" placeholder="Downtown Apartments" />
          </Field>
        </div>

        {failure && (
          <div role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
            <p>{failure.message}</p>
            {failure.reason && <p className="mt-1 text-xs opacity-80">Reason: {failure.reason}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Checking with iDoBooking…" : "Connect and import"}
          </button>
        </div>
      </form>
    </div>
  );
}
