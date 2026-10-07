import { describe, it, expect } from "vitest";
import { classifyIp, parsePotentialNumericIpv4 } from "../../src/services/ipClassifier.js";

describe("SSRF IP Classification & Blocking Matrix", () => {
  const privateAndRestrictedIps = [
    { ip: "127.0.0.1", label: "Loopback IPv4" },
    { ip: "127.0.0.2", label: "Loopback range IPv4" },
    { ip: "10.0.0.1", label: "Private RFC1918 10/8" },
    { ip: "10.254.254.254", label: "Private RFC1918 10/8 high" },
    { ip: "172.16.0.1", label: "Private RFC1918 172.16/12 low" },
    { ip: "172.31.255.255", label: "Private RFC1918 172.16/12 high" },
    { ip: "192.168.0.1", label: "Private RFC1918 192.168/16" },
    { ip: "192.168.1.254", label: "Private RFC1918 192.168/16" },
    { ip: "169.254.169.254", label: "Cloud Metadata AWS/GCP Link-Local" },
    { ip: "169.254.1.1", label: "Link-Local RFC3927" },
    { ip: "0.0.0.0", label: "Current network IPv4" },
    { ip: "100.64.0.1", label: "Carrier-grade NAT" },
    { ip: "::1", label: "Loopback IPv6" },
    { ip: "fe80::1", label: "Link-local IPv6" },
    { ip: "fc00::1", label: "Unique-local IPv6" },
    { ip: "fd12:3456:789a::1", label: "Unique-local IPv6 fd" },
    { ip: "::ffff:10.0.0.1", label: "IPv4-mapped private IPv6" },
    { ip: "::ffff:127.0.0.1", label: "IPv4-mapped loopback IPv6" },
    { ip: "::ffff:192.168.1.1", label: "IPv4-mapped private 192.168" },
  ];

  for (const { ip, label } of privateAndRestrictedIps) {
    it(`should block ${label} (${ip})`, () => {
      const result = classifyIp(ip);
      expect(result.isBlocked).toBe(true);
      expect(result.isPrivateOrLocal).toBe(true);
    });
  }

  it("should permit legitimate public IPv4 and IPv6 addresses", () => {
    const publicIps = ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700:4700::1111"];
    for (const ip of publicIps) {
      const res = classifyIp(ip);
      expect(res.isBlocked).toBe(false);
      expect(res.isPrivateOrLocal).toBe(false);
    }
  });

  describe("Alternative and Obfuscated IP Notations", () => {
    it("should parse and block decimal integer IP notation (2130706433 -> 127.0.0.1)", () => {
      const parsed = parsePotentialNumericIpv4("2130706433");
      expect(parsed).toBe("127.0.0.1");
      const classification = classifyIp(parsed!);
      expect(classification.isBlocked).toBe(true);
    });

    it("should parse and block hexadecimal IP notation (0x7f000001 -> 127.0.0.1)", () => {
      const parsed = parsePotentialNumericIpv4("0x7f000001");
      expect(parsed).toBe("127.0.0.1");
      const classification = classifyIp(parsed!);
      expect(classification.isBlocked).toBe(true);
    });

    it("should parse and block octal dotted IP notation (0177.0.0.1 -> 127.0.0.1)", () => {
      const parsed = parsePotentialNumericIpv4("0177.0.0.1");
      expect(parsed).toBe("127.0.0.1");
      const classification = classifyIp(parsed!);
      expect(classification.isBlocked).toBe(true);
    });
  });
});
