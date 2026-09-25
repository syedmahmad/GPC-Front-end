/**
 * Server-side only. Plays the part of a platform's backend (e.g. BoxBuy's):
 * it holds the platform key, creates a demo partner account and a credential
 * for it once, swaps that credential for an access token, and forwards a small
 * allow-list of calls to GuestPortal Connect. None of this ever reaches the
 * browser.
 */
import fs from "node:fs";
import path from "node:path";

const GPC_URL = (process.env.GPC_URL ?? "http://localhost:3100").replace(/\/$/, "");
const STATE_FILE = path.join(process.cwd(), ".gpc-state.json");

/** What this demo's credential may do. */
const PERMISSIONS = [
  "connections:manage",
  "properties:read",
  "reservations:read",
  "guests:name",
  "guests:contact",
];

const UUID = "[0-9a-f-]{36}";

/** The only calls the browser is allowed to make through the proxy. */
const ALLOWED: RegExp[] = [
  /^POST \/connections\/idobooking$/,
  /^GET \/connections$/,
  new RegExp(`^(GET|DELETE) /connections/${UUID}$`),
  new RegExp(`^POST /connections/${UUID}/sync$`),
  new RegExp(`^GET /properties(/${UUID})?$`),
  new RegExp(`^GET /reservations(/${UUID})?$`),
];

export const isAllowed = (method: string, target: string): boolean =>
  ALLOWED.some((rule) => rule.test(`${method} ${target}`));

interface Credential {
  clientId: string;
  clientSecret: string;
  accountId: string;
}

let credential: Credential | undefined;
let token: { value: string; expiresAt: number } | undefined;

interface GpcResponse {
  status: number;
  body: unknown;
}

async function rawFetch(
  method: string,
  target: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<GpcResponse> {
  const response = await fetch(GPC_URL + target, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let parsed: unknown = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = { message: "GPC sent an answer that is not JSON." };
  }
  return { status: response.status, body: parsed };
}

async function ensureCredential(): Promise<Credential> {
  if (credential) return credential;
  if (fs.existsSync(STATE_FILE)) {
    credential = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as Credential;
    return credential;
  }

  const id = process.env.PLATFORM_CLIENT_ID;
  const secret = process.env.PLATFORM_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "PLATFORM_CLIENT_ID and PLATFORM_CLIENT_SECRET are not set. See the README.",
    );
  }
  const platformHeaders = { "x-client-id": id, "x-client-secret": secret };

  const account = await rawFetch("POST", "/platform/accounts", platformHeaders, {
    externalRef: "demo-boxbuy-partner",
    name: "Demo partner (BoxBuy style)",
  });
  if (account.status >= 300) {
    throw new Error(`Could not create the demo account (HTTP ${account.status}). Check the platform key.`);
  }
  const accountBody = account.body as { id: string };

  const issued = await rawFetch(
    "POST",
    `/platform/accounts/${accountBody.id}/credentials`,
    platformHeaders,
    { label: "Demo frontend", permissions: PERMISSIONS },
  );
  if (issued.status >= 300) {
    throw new Error(`Could not issue a credential (HTTP ${issued.status}).`);
  }
  const issuedBody = issued.body as { clientId: string; clientSecret: string };

  credential = {
    clientId: issuedBody.clientId,
    clientSecret: issuedBody.clientSecret,
    accountId: accountBody.id,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(credential), { mode: 0o600 });
  return credential;
}

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 30_000) return token.value;
  const c = await ensureCredential();
  const response = await rawFetch("POST", "/oauth/token", {}, {
    grant_type: "client_credentials",
    client_id: c.clientId,
    client_secret: c.clientSecret,
  });
  if (response.status !== 200) {
    throw new Error(
      `GPC refused the demo credential (HTTP ${response.status}). Delete .gpc-state.json to start over.`,
    );
  }
  const body = response.body as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

/** Forwards one allowed call to GPC with the demo partner's access token. */
export async function callGpc(
  method: string,
  target: string,
  body?: unknown,
): Promise<GpcResponse> {
  return rawFetch(method, target, { authorization: `Bearer ${await accessToken()}` }, body);
}
