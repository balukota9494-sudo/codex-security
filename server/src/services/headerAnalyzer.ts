export interface HeaderAnalysisResult {
  hasHsts: boolean;
  hasCsp: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  hasReferrerPolicy: boolean;
  hasPermissionsPolicy: boolean;
  serverBanner?: string;
  poweredBy?: string;
  cookieSecurity: {
    totalCookies: number;
    missingSecure: number;
    missingHttpOnly: number;
    missingSameSite: number;
  };
  missingHeaders: string[];
  presentHeaders: string[];
  score: number; // 0 to 100
}

/**
 * Analyzes HTTP security headers and cookie security flags.
 */
export function analyzeHeaders(headers: Record<string, string>): HeaderAnalysisResult {
  const missingHeaders: string[] = [];
  const presentHeaders: string[] = [];

  const hsts = headers["strict-transport-security"];
  const csp = headers["content-security-policy"];
  const xfo = headers["x-frame-options"];
  const xcto = headers["x-content-type-options"];
  const refPol = headers["referrer-policy"];
  const permPol = headers["permissions-policy"];
  const server = headers["server"];
  const poweredBy = headers["x-powered-by"];

  if (hsts) presentHeaders.push("Strict-Transport-Security");
  else missingHeaders.push("Strict-Transport-Security");

  if (csp) presentHeaders.push("Content-Security-Policy");
  else missingHeaders.push("Content-Security-Policy");

  if (xfo) presentHeaders.push("X-Frame-Options");
  else missingHeaders.push("X-Frame-Options");

  if (xcto) presentHeaders.push("X-Content-Type-Options");
  else missingHeaders.push("X-Content-Type-Options");

  if (refPol) presentHeaders.push("Referrer-Policy");
  else missingHeaders.push("Referrer-Policy");

  if (permPol) presentHeaders.push("Permissions-Policy");
  else missingHeaders.push("Permissions-Policy");

  // Cookie analysis
  const cookieHeaders = headers["set-cookie"] ? [headers["set-cookie"]] : [];
  let missingSecure = 0;
  let missingHttpOnly = 0;
  let missingSameSite = 0;

  for (const cookie of cookieHeaders) {
    const lower = cookie.toLowerCase();
    if (!lower.includes("secure")) missingSecure++;
    if (!lower.includes("httponly")) missingHttpOnly++;
    if (!lower.includes("samesite")) missingSameSite++;
  }

  // Header posture score calculation
  let score = 0;
  if (hsts) score += 25;
  if (csp) score += 30;
  if (xfo) score += 15;
  if (xcto) score += 15;
  if (refPol) score += 10;
  if (permPol) score += 5;

  return {
    hasHsts: Boolean(hsts),
    hasCsp: Boolean(csp),
    hasXFrameOptions: Boolean(xfo),
    hasXContentTypeOptions: Boolean(xcto),
    hasReferrerPolicy: Boolean(refPol),
    hasPermissionsPolicy: Boolean(permPol),
    serverBanner: server,
    poweredBy,
    cookieSecurity: {
      totalCookies: cookieHeaders.length,
      missingSecure,
      missingHttpOnly,
      missingSameSite,
    },
    missingHeaders,
    presentHeaders,
    score,
  };
}
