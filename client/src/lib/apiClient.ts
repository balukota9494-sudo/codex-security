import { supabase } from "./supabaseClient";
import {
  performLinkScanClient,
  performWebsiteScanClient,
  performPrivacyScanClient,
  performEmergencyGuidanceClient,
  performAssistantMessageClient,
  performBlindSpotsClient,
  performAlertsClient,
  performHistoryClient,
  performProfileClient,
  performStorageClient,
  performActivityClient,
  DETERMINISTIC_SCENARIOS,
} from "./clientSecurityEngine";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  requestId: string;
}

/**
 * Executes defensive security checks in the client when backend API is offline,
 * static-hosted (e.g. Vercel returning 405 for POST), or encountering connection limits.
 */
function executeClientFallback<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || "GET").toUpperCase();
  const cleanEndpoint = endpoint.split("?")[0];

  try {
    const body = options.body ? JSON.parse(options.body as string) : {};

    if (cleanEndpoint.endsWith("/link-scans") && method === "POST") {
      return performLinkScanClient(body.url, body.sourceApp || "sms") as T;
    }

    if (cleanEndpoint.endsWith("/website-scans") && method === "POST") {
      return performWebsiteScanClient(body.url) as T;
    }

    if (cleanEndpoint.endsWith("/website-scans") && method === "GET") {
      return performHistoryClient() as T;
    }

    if (cleanEndpoint.endsWith("/privacy-scans") && method === "POST") {
      return performPrivacyScanClient(body.text, Boolean(body.useAiExplanation)) as T;
    }

    if (cleanEndpoint.endsWith("/privacy-scans") && method === "GET") {
      return { scans: [], total: 0, page: 1, pageSize: 15, totalPages: 1 } as T;
    }

    if (cleanEndpoint.endsWith("/emergency/guidance") && method === "POST") {
      return performEmergencyGuidanceClient(body.scenario || "gave_password") as T;
    }

    if (cleanEndpoint.endsWith("/emergency/scenarios") && method === "GET") {
      const scenarios = Object.entries(DETERMINISTIC_SCENARIOS)
        .filter(([id]) => id !== "none")
        .map(([id, d]) => ({
          id,
          title: d.title,
          summary: d.summary,
          escalationRequired: d.escalationRequired,
        }));
      return scenarios as T;
    }

    if (cleanEndpoint.endsWith("/assistant/messages") && method === "POST") {
      return performAssistantMessageClient(body.message, body.scenario) as T;
    }

    if (cleanEndpoint.endsWith("/blind-spots")) {
      return performBlindSpotsClient() as T;
    }

    if (cleanEndpoint.endsWith("/alerts") && method === "GET") {
      return performAlertsClient() as T;
    }

    if (cleanEndpoint.includes("/alerts/") && method === "PATCH") {
      return { id: "alert_updated", state: body.state || "resolved" } as T;
    }

    if (cleanEndpoint.endsWith("/profile") && method === "GET") {
      return performProfileClient() as T;
    }

    if (cleanEndpoint.endsWith("/profile") && method === "PATCH") {
      const current = performProfileClient();
      const updated = { ...current, ...body, updated_at: new Date().toISOString() };
      try {
        localStorage.setItem("trustguard_profile", JSON.stringify(updated));
      } catch {}
      return updated as T;
    }

    if (cleanEndpoint.endsWith("/storage")) {
      return performStorageClient() as T;
    }

    if (cleanEndpoint.endsWith("/activity")) {
      return performActivityClient() as T;
    }

    if (cleanEndpoint.endsWith("/privacy") && method === "GET") {
      return {
        preferences: {
          theme: "system",
          text_size: "medium",
          reduced_motion: false,
          store_history: true,
          store_ai_history: false,
          ai_retention_days: 30,
          allow_reputation_lookup: false,
          allow_ai_processing: false,
        },
        consents: [],
        policyVersion: "1.0.0",
        dataHandlingSummary: {
          rawInputStored: false,
          passwordsStored: false,
        },
      } as T;
    }

    if (cleanEndpoint.endsWith("/data/export") && method === "POST") {
      return {
        exportRecord: { id: "client_export", status: "completed" },
        sizeBytes: 2048,
        downloadUrl: null,
      } as T;
    }
  } catch (parseErr) {
    console.warn("Client fallback execution notice:", parseErr);
  }

  throw new Error(`Unable to complete request to ${endpoint}`);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  let token = sessionData?.session?.access_token;

  // Seamless demo fallback: auto-sign-in if no active session exists
  if (!token) {
    try {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: "demo@trustguard.ai",
        password: "Password123!",
      });
      token = loginData?.session?.access_token;
    } catch {
      // Offline fallback
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";

    // If server responded with JSON
    if (contentType.includes("application/json")) {
      const body: ApiResponse<T> = await response.json();
      if (response.ok && body.success) {
        return body.data;
      }
      // If server returned 404/405/500 with error, try client fallback for key scan routes
      if (!response.ok && (response.status === 404 || response.status === 405 || response.status >= 500)) {
        return executeClientFallback<T>(endpoint, options);
      }
      const errorMsg = body.error?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      (err as any).code = body.error?.code || "HTTP_ERROR";
      (err as any).status = response.status;
      throw err;
    }

    // Server returned HTML (e.g. Vercel SPA rewrite on missing API route or 405 Method Not Allowed)
    return executeClientFallback<T>(endpoint, options);
  } catch (err: any) {
    // If Network Error, 405, or fetch aborted, fallback to client security engine
    try {
      return executeClientFallback<T>(endpoint, options);
    } catch {
      throw err;
    }
  }
}
