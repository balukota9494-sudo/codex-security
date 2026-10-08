import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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
    const err = new Error(
      networkErr?.message || "Network connection failure. Unable to reach TrustGuard API."
    );
    (err as any).code = "NETWORK_ERROR";
    (err as any).status = 0;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";

  // If server responded with HTML (e.g. Vercel SPA rewrite fallback for missing backend route)
  if (!contentType.includes("application/json")) {
    const err = new Error(
      `API service returned non-JSON response (${response.status} ${response.statusText}). Check API configuration.`
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
