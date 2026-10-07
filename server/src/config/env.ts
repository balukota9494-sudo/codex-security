import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EnvSchema, type EnvConfig } from "@trustguard/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error("FATAL: Environment validation failed:\n" + formattedErrors);
  process.exit(1);
}

export const env: EnvConfig = parsed.data;
