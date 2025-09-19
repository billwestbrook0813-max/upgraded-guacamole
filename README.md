# MLB Daily Runs Tracker & Projection — Patched (VITE_API_BASE)

This build includes the full backend + frontend and uses **VITE_API_BASE** in the client so
production calls go to your deployed server on Render.

## Local quick start
### Server
```bash
cd server
cp .env.example .env
# set ODDS_API_KEY=your_key_here
npm install
npm run dev   # http://localhost:5177
```
### Client
```bash
cd ../client
npm install
npm run dev   # http://localhost:5173
```

## Render (Blueprint)
1) Push this repo to GitHub.
2) In Render → New → Blueprint → pick your repo (reads render.yaml).
3) On **server** service, set `ODDS_API_KEY`.
4) After creation, open the **client** service → Environment → add:
   `VITE_API_BASE=https://<your-server>.onrender.com` → Redeploy client.

— Generated 2025-09-19
