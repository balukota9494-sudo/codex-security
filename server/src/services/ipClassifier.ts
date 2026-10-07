import net from "node:net";

export interface IpClassification {
  isBlocked: boolean;
  isPrivateOrLocal: boolean;
  reason?: string;
  normalizedIp?: string;
}

/**
 * Checks if a string representation of an IPv4 octet is in octal or hex or decimal.
 * Also parses single integer numbers (e.g. 2130706433).
 */
export function parsePotentialNumericIpv4(host: string): string | null {
  const trimmed = host.trim();

  // If host is a single 32-bit integer (e.g. 2130706433 or 0x7f000001 or 017700000001)
  if (/^(0x[0-9a-fA-F]+|\d+)$/.test(trimmed)) {
    try {
      const num = trimmed.startsWith("0x") || trimmed.startsWith("0X")
        ? parseInt(trimmed, 16)
        : parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
        const b1 = (num >>> 24) & 0xff;
        const b2 = (num >>> 16) & 0xff;
        const b3 = (num >>> 8) & 0xff;
        const b4 = num & 0xff;
        return `${b1}.${b2}.${b3}.${b4}`;
      }
    } catch {
      return null;
    }
  }

  // Check 4-part representation with potential hex or octal parts (e.g. 0177.0.0.1 or 0x7f.0.0.1)
  const parts = trimmed.split(".");
  if (parts.length === 4) {
    const bytes: number[] = [];
    let hasNonStandardNotation = false;

    for (const part of parts) {
      if (part.startsWith("0x") || part.startsWith("0X")) {
        hasNonStandardNotation = true;
        const val = parseInt(part, 16);
        if (isNaN(val) || val < 0 || val > 255) return null;
        bytes.push(val);
      } else if (part.length > 1 && part.startsWith("0")) {
        hasNonStandardNotation = true;
        const val = parseInt(part, 8);
        if (isNaN(val) || val < 0 || val > 255) return null;
        bytes.push(val);
      } else if (/^\d+$/.test(part)) {
        const val = parseInt(part, 10);
        if (val < 0 || val > 255) return null;
        bytes.push(val);
      } else {
        return null;
      }
    }

    if (hasNonStandardNotation) {
      return bytes.join(".");
    }
  }

  return null;
}

/**
 * Checks if an IPv4 address is within a CIDR range.
 */
function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [range, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);

  const ipParts = ip.split(".").map(Number);
  const rangeParts = range.split(".").map(Number);

  const ipNum =
    ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
  const rangeNum =
    ((rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3]) >>> 0;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

const BLOCKED_IPV4_CIDRS = [
  "0.0.0.0/8", // Current network
  "10.0.0.0/8", // Private network RFC 1918
  "100.64.0.0/10", // Shared address space (Carrier-grade NAT)
  "127.0.0.0/8", // Loopback
  "169.254.0.0/16", // Link-local (Includes 169.254.169.254 Cloud Metadata)
  "172.16.0.0/12", // Private network RFC 1918
  "192.0.0.0/24", // IETF Protocol Assignments
  "192.0.2.0/24", // TEST-NET-1
  "192.168.0.0/16", // Private network RFC 1918
  "198.18.0.0/15", // Benchmark testing
  "198.51.100.0/24", // TEST-NET-2
  "203.0.113.0/24", // TEST-NET-3
  "224.0.0.0/4", // Multicast
  "240.0.0.0/4", // Reserved
  "255.255.255.255/32", // Broadcast
];

/**
 * Normalizes and classifies an IP address for SSRF protection.
 */
export function classifyIp(ipAddress: string): IpClassification {
  let ip = ipAddress.trim();

  // Check for IPv4 mapped into IPv6, e.g. ::ffff:10.0.0.1 or ::ffff:127.0.0.1
  const ipv4MappedMatch = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4MappedMatch) {
    ip = ipv4MappedMatch[1];
  }

  // IPv4 Classification
  if (net.isIPv4(ip)) {
    for (const cidr of BLOCKED_IPV4_CIDRS) {
      if (isIpv4InCidr(ip, cidr)) {
        return {
          isBlocked: true,
          isPrivateOrLocal: true,
          reason: `IPv4 address ${ip} falls within restricted/private range ${cidr}`,
          normalizedIp: ip,
        };
      }
    }
    return {
      isBlocked: false,
      isPrivateOrLocal: false,
      normalizedIp: ip,
    };
  }

  // IPv6 Classification
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();

    // Loopback
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") {
      return {
        isBlocked: true,
        isPrivateOrLocal: true,
        reason: "IPv6 loopback address is blocked",
        normalizedIp: ip,
      };
    }

    // Unspecified
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") {
      return {
        isBlocked: true,
        isPrivateOrLocal: true,
        reason: "IPv6 unspecified address is blocked",
        normalizedIp: ip,
      };
    }

    // Link-local: fe80::/10
    if (/^fe[89ab][0-9a-f]:/i.test(lower)) {
      return {
        isBlocked: true,
        isPrivateOrLocal: true,
        reason: "IPv6 link-local address is blocked",
        normalizedIp: ip,
      };
    }

    // Unique-local: fc00::/7 (fc00:: to fdff::)
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) {
      return {
        isBlocked: true,
        isPrivateOrLocal: true,
        reason: "IPv6 unique-local address is blocked",
        normalizedIp: ip,
      };
    }

    // Multicast: ff00::/8
    if (/^ff[0-9a-f]{2}:/i.test(lower)) {
      return {
        isBlocked: true,
        isPrivateOrLocal: true,
        reason: "IPv6 multicast address is blocked",
        normalizedIp: ip,
      };
    }

    return {
      isBlocked: false,
      isPrivateOrLocal: false,
      normalizedIp: ip,
    };
  }

  return {
    isBlocked: true,
    isPrivateOrLocal: false,
    reason: `Invalid or unclassifiable IP address: ${ip}`,
  };
}
