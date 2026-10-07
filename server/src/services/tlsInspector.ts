import tls from "node:tls";
import { LIMITS } from "@trustguard/shared";

export interface TlsInspectionResult {
  hasTls: boolean;
  authorized: boolean;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  issuer?: string;
  subject?: string;
  protocol?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  error?: string;
}

/**
 * Passively inspects the TLS certificate of a host on port 443.
 */
export async function inspectTls(hostname: string, port = 443): Promise<TlsInspectionResult> {
  return new Promise((resolve) => {
    let resolved = false;

    const timeoutHandle = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          hasTls: false,
          authorized: false,
          isExpired: false,
          isExpiringSoon: false,
          error: "TLS inspection timed out",
        });
      }
    }, Math.min(LIMITS.scanTimeoutMs, 5000));

    try {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: false, // We check authorization manually to report specific errors
        },
        () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutHandle);

          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const authError = socket.authorizationError?.message;
          const protocol = socket.getProtocol() || undefined;

          socket.end();

          if (!cert || Object.keys(cert).length === 0) {
            return resolve({
              hasTls: false,
              authorized: false,
              isExpired: false,
              isExpiringSoon: false,
              error: authError || "No certificate presented",
            });
          }

          const validToDate = new Date(cert.valid_to);
          const validFromDate = new Date(cert.valid_from);
          const now = new Date();
          const daysRemaining = Math.floor(
            (validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const isExpired = daysRemaining < 0;
          const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 14;

          const extractStr = (val: string | string[] | undefined): string | undefined => {
            if (!val) return undefined;
            return Array.isArray(val) ? val[0] : val;
          };

          const issuerStr =
            extractStr(cert.issuer?.O) || extractStr(cert.issuer?.CN) || "Unknown Issuer";
          const subjectStr =
            extractStr(cert.subject?.CN) || extractStr(cert.subject?.O) || hostname;

          resolve({
            hasTls: true,
            authorized,
            validFrom: validFromDate.toISOString(),
            validTo: validToDate.toISOString(),
            daysRemaining,
            issuer: issuerStr,
            subject: subjectStr,
            protocol,
            isExpired,
            isExpiringSoon,
            error: authError,
          });
        }
      );

      socket.on("error", (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutHandle);
          resolve({
            hasTls: false,
            authorized: false,
            isExpired: false,
            isExpiringSoon: false,
            error: err.message,
          });
        }
      });
    } catch (err: any) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutHandle);
        resolve({
          hasTls: false,
          authorized: false,
          isExpired: false,
          isExpiringSoon: false,
          error: err.message,
        });
      }
    }
  });
}
