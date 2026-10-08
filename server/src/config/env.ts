import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EnvSchema, type EnvConfig } from "@trustguard/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

let envConfig: EnvConfig;
const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const fallbackEnv = {
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    PORT: Number(process.env.PORT) || 8080,
    SUPABASE_URL: process.env.SUPABASE_URL || "https://rxyxenrcccxbshcnkygf.supabase.co",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eXhlbnJjY2N4YnNoY25reWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjgxNTMsImV4cCI6MjEwNjg0NDE1M30.Zc4Fg7gq0SiKC4sCJTUXW593ZGUuGmGL0GT54nzq55c",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eXhlbnJjY2N4YnNoY25reWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI2ODE1MywiZXhwIjoyMTA2ODQ0MTUzfQ.9Vo_SgxGdBZWX6OBlnvYfkCWUXsOyqpnV99c6qsVugg",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyD22g8wpGkACF8Tee2w9eGEjQISn9DhwaY",
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || "*",
    LOG_HASH_SALT: process.env.LOG_HASH_SALT || "trustguard_secure_salt_772819_prod",
  };
  const fallbackParsed = EnvSchema.safeParse(fallbackEnv);
  if (fallbackParsed.success) {
    envConfig = fallbackParsed.data;
  } else {
    envConfig = fallbackEnv as EnvConfig;
  }
} else {
  envConfig = parsed.data;
}

export const env: EnvConfig = envConfig;
