import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { sendError } from "../lib/envelope.js";

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as any;
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (err: any) {
      if (err.issues && Array.isArray(err.issues)) {
        // Safe sanitization: list invalid field names only, never submitted values
        const fieldNames = [
          ...new Set(err.issues.map((issue: any) => issue.path.join(".") || "payload")),
        ].join(", ");

        const msg = `Validation failed for field(s): ${fieldNames}`;
        sendError(res, "VALIDATION_ERROR", msg, 400);
        return;
      }

      sendError(res, "VALIDATION_ERROR", "Invalid request payload structure.", 400);
    }
  };
}
