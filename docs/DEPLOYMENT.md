# TRUSTGUARD AI — PRODUCTION DEPLOYMENT GUIDE

This guide details how to build and deploy TrustGuard AI into a production environment.

---

## 1. Production Architecture

```
                    ┌────────────────────────────┐
                    │  Cloudflare / Vercel Edge  │
                    │   (Frontend Static CDN)    │
                    └─────────────┬──────────────┘
                                  │ HTTPS
                                  ▼
┌────────────────────────────┐         ┌────────────────────────────┐
│      Node.js Express       │◄───────►│    Supabase Cloud PostgREST│
│  (Docker / Fly.io / Render)│         │     (PostgreSQL 15 + RLS)  │
└─────────────┬──────────────┘         └────────────────────────────┘
              │ HTTPS
              ▼
┌────────────────────────────┐
│   Google Gemini API        │
│   (gemini-2.5-flash)       │
└────────────────────────────┘
```

---

## 2. Environment Variables Checklist

### Backend Server (`server/.env`):
```ini
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://rxyxenrcccxbshcnkygf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
USER_HASH_SALT=<secure-random-64-char-hex-salt>
ALLOWED_ORIGIN=https://trustguard.ai
```

### Frontend Client (`client/.env`):
```ini
VITE_SUPABASE_URL=https://rxyxenrcccxbshcnkygf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=https://api.trustguard.ai
```
*(Note: Never place service keys or Gemini keys in client `.env`. The Vite build will abort if detected.)*

---

## 3. Build & Packaging

### Monorepo Build Command:
```bash
npm run build
```
This runs:
1. `tsc -b` on `shared`
2. `tsc` on `server` -> emits to `server/dist`
3. `tsc && vite build` on `client` -> emits minified, tree-shaken static assets to `client/dist`

---

## 4. Dockerfile for Backend Server

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
RUN npm ci

COPY shared ./shared
COPY server ./server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3001
USER node
CMD ["node", "server/dist/index.js"]
```

---

## 5. Health Checks & Monitoring

- **Liveness & Readiness**: Query `GET https://api.trustguard.ai/api/v1/health`
- **Expected Status**: HTTP 200 with `{ "status": "ok", "services": { "database": "connected" } }`
- **Sentry / APM**: Standard OpenTelemetry or Pino logger stream output.
