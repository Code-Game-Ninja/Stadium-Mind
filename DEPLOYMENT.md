# Deployment Guide — StadiumMind AI

Two hosts, because the API is a persistent Node process (Socket.IO rooms + two background loops — the sensor tick and the proactive AI ops briefing) and **cannot** run as a Vercel serverless function. Serverless functions are stateless and request-scoped; they can't hold a WebSocket open or keep a `setInterval` alive between requests.

| App | Host | Why |
|---|---|---|
| `apps/web` (Next.js) | **Vercel** | Stateless frontend, deploys cleanly as-is |
| `apps/api` (Express + Socket.IO) | **Render** | Needs a persistent process for realtime rooms + background loops |

Config files already committed to the repo root:
- `vercel.json` — Vercel build config for `apps/web`
- `render.yaml` — Render Blueprint for `apps/api`

Follow this checklist top to bottom. Each step says exactly what to click/paste and how to verify it before moving on.

---

## 0. Before you start

- [ ] **Rotate your API keys.** The `GEMINI_API_KEY` and `SPORTMONKS_API_KEY` currently in your local `apps/api/.env` have been sitting in a local file — don't paste those same values into a public-facing host. Generate fresh keys:
  - Gemini: https://aistudio.google.com/app/apikey
  - Sportmonks: https://my.sportmonks.com/ → API access
- [ ] Confirm you have a GitHub remote pushed and up to date (`git push origin main`) — both Vercel and Render deploy from your GitHub repo.
- [ ] Confirm your Firebase project is real and has Firestore + Auth enabled (Firebase Console → your project). You'll need:
  - The **service-account JSON** (Firebase Console → Project settings → Service accounts → Generate new private key)
  - The **web app config** (Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration)

---

## 1. Encode the Firebase service-account JSON (for Render)

Render (and most PaaS hosts) won't let you drop an arbitrary file next to the app the way local dev does. Instead, base64-encode the whole service-account JSON into one environment variable. `apps/api/src/firebase.ts` already handles decoding this at boot (see "How this works" below).

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("apps/api/firebase-service-account.json"))
```

**macOS/Linux:**
```bash
base64 -i apps/api/firebase-service-account.json | tr -d '\n'
```

- [ ] Run the command above, copy the entire output (one long line, no line breaks).
- [ ] Save it somewhere temporarily (password manager / secure note) — you'll paste it into Render in step 3.

> **Never commit this JSON file or the base64 string to git.** `firebase-service-account.json` is already gitignored.

---

## 2. Deploy the API to Render

### 2.1 Create the service

1. Go to https://dashboard.render.com → **New +** → **Blueprint**.
2. Connect your GitHub account if you haven't, then select the `Stadium-Mind` repo.
3. Render detects `render.yaml` at the repo root and shows the `stadiummind-api` service. Click **Apply**.

   If Render doesn't auto-detect it, create manually instead:
   - **New +** → **Web Service** → select the repo.
   - **Root Directory:** leave blank (repo root — the build command handles the workspace paths).
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm install && npm run build --workspace @stadiummind/shared && npm run build --workspace @stadiummind/api
     ```
   - **Start Command:**
     ```
     npm run start --workspace @stadiummind/api
     ```
   - **Plan:** Free (fine for a demo; free tier sleeps after 15 min idle — see note in step 5)
   - **Health Check Path:** `/api/health`

### 2.2 Set environment variables

In the Render service → **Environment** tab, set:

| Key | Value | Notes |
|---|---|---|
| `NODE_VERSION` | `20.19.0` | matches local dev |
| `PORT` | `4000` | Render also injects its own `PORT`; the app reads `process.env.PORT` either way |
| `WEB_ORIGIN` | *(placeholder for now — see step 4.3)* | must be your exact Vercel URL, no trailing slash |
| `GEMINI_API_KEY` | your **rotated** Gemini key | omit entirely to run on deterministic AI fallback instead |
| `GEMINI_MODEL` | `gemini-2.5-flash` | |
| `SPORTMONKS_API_KEY` | your **rotated** Sportmonks key | omit to rely on the organizer's manual Live Score Controller only |
| `LIVE_FEED_MATCH_ID` | *(leave blank)* | optional — pins the live feed to a specific match id |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | the base64 string from step 1 | decoded to a temp file at boot automatically |

- [ ] Do **not** set `GOOGLE_APPLICATION_CREDENTIALS` to a file path on Render — there's no file to point at. Leaving `FIREBASE_SERVICE_ACCOUNT_BASE64` set is sufficient; the app resolves the credential path itself.

### 2.3 Deploy and verify

- [ ] Click **Create Web Service** (or **Apply**, if using the Blueprint). Wait for the build + deploy to finish (watch the Logs tab).
- [ ] Confirm the boot log shows:
  ```
  [firebase] Loaded service account from FIREBASE_SERVICE_ACCOUNT_BASE64.
  Firebase Admin initialized successfully.
  StadiumMind AI API running on http://localhost:4000
  Gemini: enabled  |  Store: Firestore
  ```
  If you see `Store: in-memory demo` instead of `Firestore`, the base64 var didn't decode — check step 2.2.
- [ ] Copy your Render service URL, e.g. `https://stadiummind-api.onrender.com`.
- [ ] Test the health endpoint directly:
  ```bash
  curl https://stadiummind-api.onrender.com/api/health
  ```
  Expect: `{"ok":true,"store":"firestore","geminiEnabled":true,"liveFeed":true}` (fields may vary based on which keys you set).

---

## 3. Seed Firestore (first deploy only)

The seed script creates the demo Firebase Auth users (organizer/volunteer/fan) and Firestore documents (stadiums, matches, tickets). Run it **locally**, pointed at the same Firebase project Render uses — it writes directly to Firestore, not through the API.

- [ ] Confirm `apps/api/.env` locally has `GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json` pointing at the **same** project as the base64 you encoded in step 1.
- [ ] Run:
  ```bash
  cd apps/api
  npx tsx src/seed.ts
  ```
- [ ] Confirm output ends with `Seed process completed successfully!`
- [ ] Re-check the Render health endpoint — `GET /api/matches` should now return a non-empty list:
  ```bash
  curl https://stadiummind-api.onrender.com/api/matches
  ```

---

## 4. Deploy the web app to Vercel

### 4.1 Import the project

1. Go to https://vercel.com/new.
2. Import the `Stadium-Mind` GitHub repo.
3. Open the **"Build and Output Settings"** or **"Project Settings"** section before deploying:
   - Set **Root Directory** to `apps/web`.
   - Ensure the Framework Preset is detected as **Next.js**.
   - Leave the **Build Command** and **Output Directory** as their default values.

### 4.2 Set environment variables

In the Vercel project → **Settings → Environment Variables**, add (Production + Preview, at minimum Production):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://stadiummind-api.onrender.com/api` *(your real Render URL + `/api`)* |
| `NEXT_PUBLIC_SOCKET_URL` | `https://stadiummind-api.onrender.com` *(same Render URL, no `/api`)* |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase Console → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | same (optional) |

### 4.3 Deploy

- [ ] Click **Deploy**. Wait for the build to finish.
- [ ] Copy your Vercel URL, e.g. `https://stadium-mind.vercel.app`.
- [ ] **Go back to Render** (step 2.2) and set `WEB_ORIGIN` to this exact Vercel URL (no trailing slash) — this is required for CORS and Socket.IO to accept requests from the deployed frontend.
- [ ] Render will auto-redeploy after the env var change (or trigger manually: **Manual Deploy → Deploy latest commit**).

---

## 5. Verify the full live deployment

- [ ] Run the smoke test against the live API:
  ```bash
  node scripts/smoke.mjs https://stadiummind-api.onrender.com/api
  ```
  Expect all 7 checks to `[PASS]`.

- [ ] Open the live web app (`https://stadium-mind.vercel.app`) and walk the demo path:
  1. **Match Hub** → pick a match → *I have a ticket*.
  2. Verify ticket `WC2026-453621`.
  3. **Journey planner** → generate a journey (confirms API + Gemini/fallback work).
  4. **Login** (`/login`) with `organizer@stadiummind.ai` / `demo1234` → **Command Center** (`/organizer`) → confirm health score, live metrics, and AI summary populate (confirms Socket.IO connection to Render is live — check the browser Network tab for a `wss://stadiummind-api.onrender.com` connection).
  5. Trigger a **Simulation control** (e.g. *Increase Crowd*) → confirm the dashboard updates live without a refresh.
  6. **Volunteer Workspace** (`/volunteer`, login `volunteer@stadiummind.ai` / `demo1234`) → confirm SOP assistant responds.

- [ ] Open browser DevTools → Network/Console on the live site and confirm **no CORS errors** and **no failed requests to `localhost`** (that would mean an env var still points at localhost).

### ⚠️ Free-tier cold start

Render's free plan spins the API down after ~15 minutes of no traffic. The **first** request after idle can take 30–60 seconds to respond while it wakes up. If you're demoing live in front of judges:
- [ ] Hit the health endpoint 2–3 minutes before your demo slot to warm it up: `curl https://stadiummind-api.onrender.com/api/health`
- [ ] Or upgrade the Render service to a paid tier (no cold starts) before judging, if budget allows.

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Web app loads but shows no matches / stuck loading | `NEXT_PUBLIC_API_BASE_URL` wrong or API not reachable | Check the exact Render URL + `/api` suffix; test `curl <url>/api/health` directly |
| Organizer dashboard never connects / no live updates | `NEXT_PUBLIC_SOCKET_URL` wrong, or `WEB_ORIGIN` on Render doesn't match Vercel URL exactly | Both must match exactly (protocol + no trailing slash) |
| Render logs show `Store: in-memory demo` instead of `Firestore` | `FIREBASE_SERVICE_ACCOUNT_BASE64` missing/invalid | Re-run the encode command in step 1, re-paste, redeploy |
| Login fails for demo users | Firestore wasn't seeded, or seed ran against a different Firebase project than Render's credentials | Re-check step 3; confirm the same project ID everywhere |
| `GET /api/matches` returns an empty list after seeding | Seed ran but Render still points at a different project, or seed failed partway | Check seed script output for errors; re-run `npx tsx src/seed.ts` |
| CORS errors in browser console | `WEB_ORIGIN` not set or mismatched on Render | Set it to the exact deployed Vercel origin, redeploy API |
| Everything works locally but not live | An env var still says `localhost` somewhere | Re-check both Vercel's and Render's env var lists — search for `localhost` |

---

## How this works (for reference)

- **`vercel.json`** builds `@stadiummind/shared` then `@stadiummind/web` from the monorepo root and serves `apps/web/.next` — Vercel's Next.js runtime handles the rest (static + dynamic routes, image optimization, etc.) automatically.
- **`render.yaml`** defines a single persistent Node web service. Render builds `@stadiummind/shared` + `@stadiummind/api`, then runs `node dist/server.js` (via `npm run start --workspace @stadiummind/api`), which keeps Socket.IO rooms and both background loops (`sensorLoop.ts`, `opsBriefingLoop.ts`) alive indefinitely — something a serverless platform cannot do.
- **`FIREBASE_SERVICE_ACCOUNT_BASE64`** (`apps/api/src/firebase.ts`): decoded once at process boot to a temp file, then `GOOGLE_APPLICATION_CREDENTIALS` is pointed at that temp path automatically. Every existing `USE_FIREBASE` check in the codebase (`store.ts`, `authMiddleware.ts`) is keyed off `GOOGLE_APPLICATION_CREDENTIALS`, so nothing else needed to change. Local dev is unaffected — it keeps using the file path directly and never touches this code path.
- Zero-config demo mode still works on both hosts if you skip `GEMINI_API_KEY` / `FIREBASE_SERVICE_ACCOUNT_BASE64` entirely — the app falls back to deterministic AI and in-memory state, exactly as it does locally.
