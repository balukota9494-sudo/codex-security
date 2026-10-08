import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { ipLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import Routers
import { healthRouter } from "./routes/health.js";
import { profileRouter } from "./routes/profile.js";
import { websiteScansRouter } from "./routes/websiteScans.js";
import { linkScansRouter } from "./routes/linkScans.js";
import { privacyScansRouter } from "./routes/privacyScans.js";
import { assistantRouter } from "./routes/assistant.js";
import { emergencyRouter } from "./routes/emergency.js";
import { alertsRouter } from "./routes/alerts.js";
import { privacyRouter } from "./routes/privacy.js";
import { dataRouter } from "./routes/data.js";
import { storageRouter } from "./routes/storage.js";
import { activityRouter } from "./routes/activity.js";
import { capabilitiesRouter } from "./routes/capabilities.js";
import { blindSpotsRouter } from "./routes/blindSpots.js";
import { feedbackRouter } from "./routes/feedback.js";
import { adminRouter } from "./routes/admin.js";

export function createApp(): Express {
  const app = express();

  // 1. Tracing ID
  app.use(requestIdMiddleware);

  // 2. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", env.SUPABASE_URL],
          frameAncestors: ["'none'"],
        },
      },
      referrerPolicy: { policy: "no-referrer" },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 3. Robust CORS allow-list
  const rawOrigins = env.CORS_ALLOWED_ORIGINS || "*";
  const configuredOrigins = rawOrigins.split(",").map((o) => o.trim());

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true; // Server-to-server, curl, same-origin, probes
    if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) return true;
    // Allow all Vercel domains (production & preview deployments)
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) return true;
    // Allow Render domains
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*onrender\.com$/.test(origin)) return true;
    // Allow local development hosts
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    })
  );

  // Handle preflight across all routes
  app.options("*", cors());

  // 4. Root health probes for Render and uptime checks
  app.get("/", (_req, res) => {
    res.json({
      name: "TRUSTGUARD AI Core Server",
      status: "healthy",
      tagline: "Security You Can See. Privacy You Can Control. AI You Can Trust.",
      health: "/api/health",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  // 5. Bounded body parser (64 KB cap)
  app.use(express.json({ limit: "64kb" }));

  // 5. Global IP Rate Limiting
  app.use(ipLimiter);

  // 6. Mount API Routes (support both /api and /api/v1 prefixes)
  const routes = [
    ["/health", healthRouter],
    ["/profile", profileRouter],
    ["/website-scans", websiteScansRouter],
    ["/link-scans", linkScansRouter],
    ["/privacy-scans", privacyScansRouter],
    ["/scans/website", websiteScansRouter],
    ["/scans/link", linkScansRouter],
    ["/scans/privacy", privacyScansRouter],
    ["/assistant", assistantRouter],
    ["/emergency", emergencyRouter],
    ["/alerts", alertsRouter],
    ["/privacy", privacyRouter],
    ["/data", dataRouter],
    ["/storage", storageRouter],
    ["/activity", activityRouter],
    ["/capabilities", capabilitiesRouter],
    ["/blind-spots", blindSpotsRouter],
    ["/feedback", feedbackRouter],
    ["/admin", adminRouter],
  ] as const;

  for (const [routePath, router] of routes) {
    app.use(`/api${routePath}`, router);
    app.use(`/api/v1${routePath}`, router);
  }

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
