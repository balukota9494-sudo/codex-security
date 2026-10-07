import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "authorization",
      "headers.authorization",
      "cookie",
      "headers.cookie",
      "password",
      "token",
      "apiKey",
      "body.text",
      "body.message",
      "body.password",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.text",
      "req.body.message",
      "req.body.password",
      "req.body.notes",
      "notes",
      "prompt",
      "rawResponse",
    ],
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
