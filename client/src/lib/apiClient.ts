import { supabase } from "./supabaseClient";

export const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");
  }
  // In development, Vite dev proxy handles /api to localhost:8080
  if (import.meta.env.DEV) {
    return "";
  }
  // In production, fallback to Render backend service
  return "https://codex-security-api.onrender.com";
};

export const API_BASE = getApiBase();

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  requestId: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | undefined;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token;

    // Seamless demo sign-in fallback if no active session exists
    if (!token) {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: "demo@trustguard.ai",
        password: "Password123!",
      });
      token = loginData?.session?.access_token;
    }
  } catch {
    // Auth retrieval failed or offline; continue without token
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    const isNetworkOrColdBoot =
      networkErr?.name === "AbortError" ||
      networkErr?.name === "TypeError" ||
      networkErr?.message?.includes("Failed to fetch") ||
      networkErr?.message?.includes("NetworkError") ||
      networkErr?.message?.includes("Load failed");

    const message = isNetworkOrColdBoot
      ? "Unable to reach TrustGuard API backend. The service may be waking up on Render (free tier cold-start takes ~30-45s). Please wait a moment and try again."
      : (networkErr?.message || "Network connection failure. Unable to reach TrustGuard API.");

    const err = new Error(message);
    (err as any).code = "NETWORK_ERROR";
    (err as any).status = 0;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";

  // If server responded with HTML (e.g. Vercel SPA rewrite fallback for missing backend route, or Render 502/503 cold boot)
  if (!contentType.includes("application/json")) {
    let extraHint = "";
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      extraHint = " Backend service is spinning up or unavailable on Render (cold start takes ~30-45s). Please retry in 30 seconds.";
    } else if (response.status === 405) {
      extraHint = " Method not allowed by host. Ensure backend proxy or VITE_API_BASE_URL points to Render API.";
    } else if (response.status === 404) {
      extraHint = " API endpoint route was not found on backend.";
    }
    const err = new Error(
      `API service returned status ${response.status} (${response.statusText || "Non-JSON response"}).${extraHint}`
    );
    (err as any).code = "NON_JSON_RESPONSE";
    (err as any).status = response.status;
    throw err;
  }

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    const err = new Error("Unable to parse API response as JSON.");
    (err as any).code = "PARSE_ERROR";
    (err as any).status = response.status;
    throw err;
  }

  if (!response.ok || !body?.success) {
    const errorMsg =
      body?.error?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).code = body?.error?.code || "HTTP_ERROR";
    (err as any).status = response.status;
    (err as any).requestId = body?.requestId;
    throw err;
  }

  return body.data;
}
