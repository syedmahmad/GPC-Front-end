# GuestPortal Connect: demo frontend

A small Next.js (TypeScript, Tailwind CSS) app that imitates the screen a
platform such as BoxBuy will have: a **Sync with GPC** button, a form for the
customer's iDoBooking details, import progress, and tables of the imported
properties and reservations. It also shows every API call it makes.

It is a demo of how the GuestPortal Connect API is used. The real product is the
API (`guestportal-connect`), not this app.

## How it works

```
Browser  ->  /api/gpc/* (Next.js route handler)  ->  GuestPortal Connect API
```

The route handler (`src/app/api/gpc/[...path]/route.ts`) plays the part of the
platform's server. It holds the platform key, creates one demo partner account
and credential on first use, swaps them for an access token, and forwards only a
short allow-list of calls (connections, properties, reservations). Nothing
secret is ever sent to the browser.

## The form

| Field | Required | Rules |
|---|---|---|
| iDoBooking API address | Yes | Full address starting with `https://`, up to 500 characters |
| Application login | Yes | Up to 200 characters |
| API key | Yes | Up to 500 characters. Hidden by default, never shown again |
| Name for this connection | No | Up to 200 characters |

These match what `POST /connections/idobooking` accepts.

## Run it

You need the API running with a database, and a platform key.

1. In `guestportal-connect`: `npm run build`, then `npm run seed:platform -- "Demo BoxBuy"`.
   Note the printed client id and secret (the secret is shown once).
2. Start the API on port 3100: `PORT=3100 npm run start`.
3. Here, copy `.env.example` to `.env.local` and fill in the platform key.
4. `npm install`, then `npm run dev` (or `npm run build && npm start`).
5. Open http://localhost:3000.

If you connect a **real** iDoBooking account, the Poland VPN must be on: iDoBooking only
accepts calls from allowed addresses.

`.env.local` and `.gpc-state.json` (the demo credential created on first run) are
git-ignored. Delete `.gpc-state.json` to start over.

## Scripts

`npm run dev`, `npm run build`, `npm start`, `npm run lint`.
