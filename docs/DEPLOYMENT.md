# TRUSTGUARD AI — PRODUCTION DEPLOYMENT GUIDE

This guide details how to build and deploy TrustGuard AI into a production environment with Render (Backend) and Vercel (Frontend).

---

## 1. Public Production URLs

| Component | Host | Public URL | Status Check |
|---|---|---|---|
| **Frontend Web App** | Vercel | [https://codex-security-ashy.vercel.app](https://codex-security-ashy.vercel.app) | Serves React SPA (Vite) |
| **Backend API Core** | Render | [https://codex-security-api.onrender.com](https://codex-security-api.onrender.com) | `GET /api/health` |

---

## 2. Production Architecture

```
                    ┌────────────────────────────┐
                    │       Vercel Edge          │
                    │   (Frontend Static CDN)    │
                    │ codex-security-ashy.vercel.app
                    └─────────────┬──────────────┘
                                  │ Direct Fetch / Proxy (/api/*)
                                  ▼
┌────────────────────────────┐         ┌────────────────────────────┐
│      Node.js Express       │◄───────►│    Supabase Cloud PostgREST│
│       Render Web           │         │     (PostgreSQL 15 + RLS)  │
│ codex-security-api.onrender│         └────────────────────────────┘
└─────────────┬──────────────┘
              │ HTTPS
              ▼
┌────────────────────────────┐
│   Google Gemini API        │
│   (gemini-2.5-flash)       │
└────────────────────────────┘
```

---

## 3. Backend Deployment on Render

### Option A: 1-Click Blueprint Deploy (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `balukota9494-sudo/codex-security`.
4. Render will automatically detect `render.yaml` and configure:
   - Service Name: `codex-security-api`
   - Build Command: `npm install && npm run build --workspace=@trustguard/shared && npm run build --workspace=@trustguard/server`
   - Start Command: `node server/dist/index.js`
   - Health Check Path: `/api/health`
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. In Render, select **New +** -> **Web Service**.
2. Connect `balukota9494-sudo/codex-security`.
3. Fill in the service configuration:
   - **Name**: `codex-security-api`
   - **Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build --workspace=@trustguard/shared && npm run build --workspace=@trustguard/server`
   - **Start Command**: `node server/dist/index.js`
   - **Health Check Path**: `/api/health`
4. Add the required Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `SUPABASE_URL`: `https://rxyxenrcccxbshcnkygf.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `GEMINI_API_KEY`: `AIzaSy...`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `CORS_ALLOWED_ORIGINS`: `https://codex-security-ashy.vercel.app,http://localhost:5173,https://*.vercel.app`
   - `LOG_HASH_SALT`: `trustguard_secure_salt_772819_prod`
5. Click **Create Web Service**.

---

## 4. Frontend Deployment on Vercel

1. In the [Vercel Dashboard](https://vercel.com/dashboard), import `balukota9494-sudo/codex-security`.
2. Vercel automatically detects `vercel.json` with settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build --workspace=client`
   - **Output Directory**: `client/dist`
3. The API rewrite proxy in `vercel.json` transparently proxies `/api/:path*` to `https://codex-security-api.onrender.com/api/:path*`.
4. (Optional) Set `VITE_API_BASE_URL` in Vercel project environment variables to `https://codex-security-api.onrender.com`.

---

## 5. Cold-Start Notes (Render Free Tier)

Render free tier web services spin down after 15 minutes of inactivity:
- The first request to a sleeping server may take **30-45 seconds** to spin up.
- The TrustGuard client has built-in connection detection with user-friendly notices advising the user if the server is waking up, avoiding raw "Failed to fetch" crashes.
