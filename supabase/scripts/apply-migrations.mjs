/**
 * TRUSTGUARD AI - Supabase Migration Runner
 * Applies SQL migrations to Supabase Cloud PostgreSQL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || "https://rxyxenrcccxbshcnkygf.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eXhlbnJjY2N4YnNoY25reWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI2ODE1MywiZXhwIjoyMTA2ODQ0MTUzfQ.9Vo_SgxGdBZWX6OBlnvYfkCWUXsOyqpnV99c6qsVugg";
const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  console.log("==========================================");
  console.log("TRUSTGUARD AI: Supabase Migration Runner");
  console.log("Target Project URL:", SUPABASE_URL);
  console.log("==========================================\n");

  const migrationFile = path.resolve(__dirname, "../migrations/001_initial_schema.sql");
  if (!fs.existsSync(migrationFile)) {
    console.error(`Migration file not found at: ${migrationFile}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFile, "utf-8");
  console.log(`Loaded migration: 001_initial_schema.sql (${sqlContent.length} bytes)`);

  // If DATABASE_URL is provided, we can connect via pg
  if (DATABASE_URL) {
    try {
      console.log("Connecting directly via PostgreSQL connection string (DATABASE_URL)...");
      const { default: pg } = await import("pg");
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      console.log("Connected to PostgreSQL. Executing migration...");
      await client.query(sqlContent);
      console.log("✓ Migration executed successfully via PostgreSQL connection!");
      await client.end();
      return;
    } catch (err) {
      console.error("Error executing via pg:", err.message);
    }
  }

  // Attempt Supabase SQL API / RPC
  console.log("\nAttempting Supabase service endpoint migration...");
  try {
    // Try via Supabase SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (response.ok) {
      console.log("✓ Migration executed successfully via Supabase RPC exec_sql!");
      return;
    } else {
      const errText = await response.text();
      console.log(`Note: RPC exec_sql returned status ${response.status} (${errText.slice(0, 100)}).`);
    }
  } catch (err) {
    console.log("RPC attempt note:", err.message);
  }

  console.log("\n============================================================");
  console.log("SQL Schema File Ready: supabase/migrations/001_initial_schema.sql");
  console.log("To apply this migration directly to your Supabase Cloud project:");
  console.log("1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/rxyxenrcccxbshcnkygf");
  console.log("2. Navigate to 'SQL Editor' -> 'New query'");
  console.log("3. Paste the contents of supabase/migrations/001_initial_schema.sql");
  console.log("4. Click 'Run' to apply all tables, triggers, and RLS policies.");
  console.log("Or provide DATABASE_URL in .env to run automatically via `npm run migrate`.");
  console.log("============================================================\n");
}

run().catch(console.error);
