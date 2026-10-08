import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { runRetentionPurge } from "./services/retentionJobs.js";

const app = createApp();

const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(
    { port: env.PORT, environment: env.NODE_ENV },
    "🛡️ TRUSTGUARD AI Core Server running"
  );
  console.log(`\n======================================================`);
  console.log(`🛡️  TRUSTGUARD AI Server listening on http://localhost:${env.PORT}`);
  console.log(`   Tagline: Security You Can See. Privacy You Can Control. AI You Can Trust.`);
  console.log(`======================================================\n`);

  // Run initial retention purge on startup
  runRetentionPurge().catch((err) => {
    logger.warn({ err: err.message }, "Notice: initial retention purge encountered an issue");
  });

  // Schedule retention purge every 6 hours
  setInterval(() => {
    runRetentionPurge().catch((err) => {
      logger.warn({ err: err.message }, "Notice: scheduled retention purge encountered an issue");
    });
  }, 6 * 60 * 60 * 1000);
});

// Graceful termination handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, closing server gracefully...");
  server.close(() => {
    logger.info("Server terminated.");
    process.exit(0);
  });
});
