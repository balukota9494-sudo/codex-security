import type { Response } from "express";

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  error: null;
  requestId: string;
}

export interface ApiErrorEnvelope {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const requestId = (res.locals.requestId as string) || "unknown-request";
  const envelope: ApiSuccessEnvelope<T> = {
    success: true,
    data,
    error: null,
    requestId,
  };
  return res.status(statusCode).json(envelope);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400
): Response {
  const requestId = (res.locals.requestId as string) || "unknown-request";
  const envelope: ApiErrorEnvelope = {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
    requestId,
  };
  return res.status(statusCode).json(envelope);
}
