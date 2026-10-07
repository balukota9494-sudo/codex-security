import dns from "node:dns/promises";
import net from "node:net";
import { Agent, fetch as undiciFetch, Response as UndiciResponse } from "undici";
import { LIMITS } from "@trustguard/shared";
import { classifyIp, parsePotentialNumericIpv4 } from "./ipClassifier.js";
import { logger } from "../lib/logger.js";

export interface SafeFetchResult {
  ok: boolean;
  statusCode: number;
  statusText: string;
  finalUrl: string;
  headers: Record<string, string>;
  bodySnippet: string;
  redirectUrl?: string;
  isRedirect: boolean;
  pinnedIp: string;
  contentType: string;
  responseTimeMs: number;
  failureReason?: string;
  isSsrfBlocked?: boolean;
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "metadata.google.internal",
  "instance-data",
  "metadata",
  "169.254.169.254",
]);

/**
 * Validates a target URL against all SSRF policies prior to outbound connection.
 */
export async function validateTargetUrl(rawUrl: string): Promise<{
  safeUrl: URL;
  resolvedIp: string;
  hostname: string;
}> {
  let urlObj: URL;
  try {
    const trimmed = rawUrl.trim().normalize("NFC");
    // If input already has a scheme (e.g. http:, https:, ftp:, file:, javascript:), parse directly
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
    const candidateUrl = hasScheme ? trimmed : `https://${trimmed}`;
    urlObj = new URL(candidateUrl);
  } catch (err) {
    throw new Error("Invalid URL format or encoding.");
  }

  // 1. Allow only http: and https:
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    throw new Error(`Forbidden protocol: ${urlObj.protocol}. Only HTTP and HTTPS are permitted.`);
  }

  // 2. Reject embedded credentials
  if (urlObj.username || urlObj.password) {
    throw new Error("URLs containing embedded username or password credentials are forbidden.");
  }

  // 3. Hostname checks
  const hostname = urlObj.hostname.toLowerCase();
  if (!hostname || hostname.length > 253) {
    throw new Error("Invalid hostname length.");
  }

  // Reject single-label bare hosts (e.g. "localhost", "internal", "router")
  if (!hostname.includes(".") && hostname !== "localhost") {
    throw new Error(`Single-label bare host "${hostname}" is blocked.`);
  }

  // Check explicit hostname blocklist
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan")
  ) {
    throw new Error(`Hostname "${hostname}" is prohibited by security policy.`);
  }

  // 4. Check if hostname is an IP literal (including numeric, octal, hex, or decimal)
  const numericIpv4 = parsePotentialNumericIpv4(hostname);
  const potentialIp = numericIpv4 || hostname;

  if (net.isIP(potentialIp)) {
    const classification = classifyIp(potentialIp);
    if (classification.isBlocked) {
      throw new Error(`IP address ${potentialIp} is blocked: ${classification.reason}`);
    }
    return {
      safeUrl: urlObj,
      resolvedIp: classification.normalizedIp || potentialIp,
      hostname,
    };
  }

  // 5. DNS Resolution & Verification of all addresses
  let resolvedAddresses: string[] = [];
  try {
    const lookupA = await dns.resolve4(hostname).catch(() => []);
    const lookupAaaa = await dns.resolve6(hostname).catch(() => []);
    resolvedAddresses = [...lookupA, ...lookupAaaa];
  } catch (err: any) {
    throw new Error(`DNS resolution failed for hostname "${hostname}": ${err.message}`);
  }

  if (resolvedAddresses.length === 0) {
    throw new Error(`Host "${hostname}" could not be resolved to any IP address.`);
  }

  // Validate every single resolved IP address against the SSRF policy
  for (const addr of resolvedAddresses) {
    const classification = classifyIp(addr);
    if (classification.isBlocked) {
      throw new Error(
        `Resolved IP address ${addr} for host "${hostname}" is restricted: ${classification.reason}`
      );
    }
  }

  // Pin the first validated IP address to prevent DNS rebinding
  const pinnedIp = resolvedAddresses[0];

  return {
    safeUrl: urlObj,
    resolvedIp: pinnedIp,
    hostname,
  };
}

/**
 * Performs an SSRF-hardened, passive HTTP GET request.
 * Pins DNS to prevent rebinding, bounds execution time and payload size.
 */
export async function safeFetch(
  rawUrl: string,
  options: {
    followRedirects?: boolean;
    maxRedirects?: number;
    timeoutMs?: number;
  } = {}
): Promise<SafeFetchResult> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? LIMITS.scanTimeoutMs;
  const maxRedirects = options.maxRedirects ?? LIMITS.maxRedirects;
  const followRedirects = options.followRedirects ?? LIMITS.followRedirectsDefault;

  let currentUrl = rawUrl;
  let redirectCount = 0;

  while (true) {
    let validated: { safeUrl: URL; resolvedIp: string; hostname: string };
    try {
      validated = await validateTargetUrl(currentUrl);
    } catch (err: any) {
      return {
        ok: false,
        statusCode: 0,
        statusText: "SSRF_BLOCKED",
        finalUrl: currentUrl,
        headers: {},
        bodySnippet: "",
        isRedirect: false,
        pinnedIp: "",
        contentType: "",
        responseTimeMs: Date.now() - startTime,
        failureReason: err.message,
        isSsrfBlocked: true,
      };
    }

    const { safeUrl, resolvedIp, hostname } = validated;

    // Build custom undici dispatcher with pinned DNS IP to thwart DNS rebinding
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, _options, callback) => {
          // Socket connection is forcibly pinned to the IP we previously validated
          const isV6 = net.isIPv6(resolvedIp);
          callback(null, resolvedIp, isV6 ? 6 : 4);
        },
      },
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
      maxRedirections: 0, // We control redirections manually
    });

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response: UndiciResponse = await undiciFetch(safeUrl.toString(), {
        dispatcher,
        signal: controller.signal,
        method: "GET",
        headers: {
          "User-Agent": "TrustGuardAI-PassiveCheck/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
        },
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key.toLowerCase()] = val;
      });

      const statusCode = response.status;
      const isRedirect = [301, 302, 303, 307, 308].includes(statusCode);
      const location = responseHeaders["location"];

      // Read capped body (up to LIMITS.maxResponseBytes)
      let bodySnippet = "";
      if (response.body) {
        let bytesRead = 0;
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.body as any) {
          bytesRead += chunk.length;
          chunks.push(chunk);
          if (bytesRead >= LIMITS.maxResponseBytes) {
            // Cap exceeded: abort remaining stream
            break;
          }
        }
        bodySnippet = Buffer.concat(chunks).toString("utf-8");
      }

      if (isRedirect && location) {
        let nextTargetUrl: string;
        try {
          nextTargetUrl = new URL(location, safeUrl.toString()).toString();
        } catch {
          nextTargetUrl = location;
        }

        if (followRedirects && redirectCount < maxRedirects) {
          redirectCount++;
          currentUrl = nextTargetUrl;
          continue;
        }

        return {
          ok: statusCode >= 200 && statusCode < 400,
          statusCode,
          statusText: response.statusText,
          finalUrl: safeUrl.toString(),
          headers: responseHeaders,
          bodySnippet: bodySnippet.slice(0, 10000),
          redirectUrl: nextTargetUrl,
          isRedirect: true,
          pinnedIp: resolvedIp,
          contentType: responseHeaders["content-type"] || "",
          responseTimeMs: Date.now() - startTime,
        };
      }

      return {
        ok: response.ok,
        statusCode,
        statusText: response.statusText,
        finalUrl: safeUrl.toString(),
        headers: responseHeaders,
        bodySnippet: bodySnippet.slice(0, 10000),
        isRedirect: false,
        pinnedIp: resolvedIp,
        contentType: responseHeaders["content-type"] || "",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        ok: false,
        statusCode: 0,
        statusText: "FETCH_FAILED",
        finalUrl: safeUrl.toString(),
        headers: {},
        bodySnippet: "",
        isRedirect: false,
        pinnedIp: resolvedIp,
        contentType: "",
        responseTimeMs: Date.now() - startTime,
        failureReason: err.name === "AbortError" ? "Request timed out." : err.message,
      };
    } finally {
      clearTimeout(timeoutHandle);
      await dispatcher.close().catch(() => {});
    }
  }
}
