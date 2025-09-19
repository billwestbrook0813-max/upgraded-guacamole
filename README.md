# MLB Daily Runs Tracker & Projection — Full Build (GitHub‑ready)

This repo contains a complete, deployable app:
- **Backend (Express)** — fetches MLB schedule/pitchers (MLB Stats API) + totals (The Odds API), computes market‑implied totals (de‑vig), expected remaining, and **Projected Slate Finish**.
- **Frontend (React + Vite + Tailwind)** — dashboard with totals, ticker (PST), table incl. **probable pitchers W‑L & ERA**, bookmaker selector, dark mode, and a debug modal.
- **render.yaml** — one‑click Blueprint deploy on Render (server + static client).
- **Optional** Docker bits (local dev via `docker compose`) — *no Docker Hub required*.

## Quick Start (Local)
### 1) Server
```bash
cd server
cp .env.example .env
# EDIT .env and set:
# ODDS_API_KEY=your_key_here
npm install
npm run dev   # http://localhost:5177
```
Sanity checks:
- `GET /health`
- `GET /api/slate?date=YYYY-MM-DD`
- `GET /api/projection?date=YYYY-MM-DD`
- `GET /api/ics?date=YYYY-MM-DD`

### 2) Client
```bash
cd ../client
npm install
npm run dev   # http://localhost:5173
```

## Deploy on Render (Blueprint)
1. Push this repo to GitHub.
2. In Render → **New → Blueprint**, select your repo. It reads `render.yaml` and creates:
   - **Web Service** (server)
   - **Static Site** (client)
3. On the **server service**, set environment variable:
   ```
   ODDS_API_KEY=your_key_here
   ```
4. Deploy. Client calls the server via `VITE_API_BASE` preset in `render.yaml`.

## Formulas (implemented in `server/src/lib/projection.js`)
- American odds → implied probability:
  - If odds ≥ 0: `p_raw = 100 / (odds + 100)`
  - If odds < 0: `p_raw = (-odds) / ((-odds) + 100)`
- De‑vig totals for line L:
  `p_over = p_over_raw / (p_over_raw + p_under_raw)`
- Market‑implied total (median) from alternates by interpolation where `p_over(L*) ≈ 0.5`.
- Projected slate = *runs so far* + sum over not‑final games of `max(0, implied_total − runs_so_far)`.

— Generated 2025-09-19
