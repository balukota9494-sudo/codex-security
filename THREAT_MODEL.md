# TRUSTGUARD AI — STRIDE THREAT MODEL

This threat model outlines the security boundaries, potential threat actors, STRIDE classification, and corresponding mitigation architecture for TrustGuard AI.

---

## 1. System Boundaries & Trust Zones

```
┌────────────────────────────────────────────────────────┐
│ ZONE 0: Untrusted External Web & Internet Targets      │
│ (Phishing links, malicious servers, DNS rebinders)     │
└───────────────────────────▲────────────────────────────┘
                            │ safeFetch (SSRF boundary)
┌───────────────────────────▼────────────────────────────┐
│ ZONE 1: API Server & Worker Services                   │
│ (Express, IP Classifier, TLS Inspector, Quota Manager) │
└──────▲────────────────────▲────────────────────▲───────┘
       │ HTTPS / JWT        │ HTTPS / API Key    │ HTTPS / RLS
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│ ZONE 2:     │      │ ZONE 3:     │      │ ZONE 4:     │
│ User Browser│      │ Google      │      │ Supabase    │
│ Client      │      │ Gemini AI   │      │ PostgreSQL  │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## 2. Threat Actor Profiles

1. **Phishing Campaign Operator**: Attempts to craft confusing domains (punycode, Levenshtein homoglyphs) to trick users into believing a deceptive link is legitimate.
2. **SSRF Exploiter**: Supplies internal IP addresses, AWS instance metadata URIs (`http://169.254.169.254`), or private subnet addresses to inspect TrustGuard's host network environment.
3. **Prompt Injection Adversary**: Injects malicious instructions into webpage DOM snippets or assistant chat prompts to manipulate the AI into issuing false `SAFE_LOOKING` ratings.
4. **Data Harvester**: Attempts to extract private scan histories or telemetry across user accounts via Insecure Direct Object References (IDOR).
5. **Denial-of-Service Attacker**: Attempts to hang backend workers using infinite redirect loops, slowloris connections, or 500 MB response bodies.

---

## 3. STRIDE Threat Analysis & Mitigations

### 3.1. Spoofing (Identity & Authenticity)
- **Threat**: Attacker creates a lookalike domain (e.g. `paypa1.com`, `g00gle.com`, or cyrillic `аpple.com`) to impersonate trusted financial or identity platforms.
- **Mitigation**:
  - `urlAnalyzer.ts` converts internationalized domain names (IDNA) from punycode to Unicode and checks against top 200 high-risk brand fingerprints.
  - Levenshtein distance calculation with threshold ≤ 2 flags homoglyph and typo-squatting attempts.
  - Status is escalated to `HIGH_RISK` or `CAUTION` with explicit callouts in Verified Signals.

### 3.2. Tampering (Data Integrity)
- **Threat**: Man-in-the-middle or upstream proxy alters TLS certificates or headers.
- **Mitigation**:
  - `tlsInspector.ts` establishes direct TLS connection to port 443 with SNI validation.
  - Extracts X.509 certificate expiry date, issuer CN/O, and Subject Alternative Names (SANs). Expired, self-signed, or untrusted certificates trigger immediate risk score downgrades.

### 3.3. Repudiation (Audit & Traceability)
- **Threat**: User claims they were not warned about a risky website, or malicious admin denies unauthorized data access.
- **Mitigation**:
  - Every scan creates an immutable record in `reports` containing a SHA-256 fingerprint, full 9-element diagnostic payload, and timestamp.
  - Admin access is restricted via `adminOnly` middleware and logs every privileged query into `activity_logs`.

### 3.4. Information Disclosure (Confidentiality)
- **Threat A**: Attacker submits `http://169.254.169.254/latest/meta-data/` to steal cloud provider IAM credentials.
- **Mitigation A**: Comprehensive IP classifier blocks private, link-local, loopback, and carrier-grade NAT IPs. DNS lookup pinning prevents DNS rebinding attacks.
- **Threat B**: User accidentally pastes an AWS access key or bank account number into the chat prompt or scan input.
- **Mitigation B**: Client-side PII detector highlights tokens immediately and applies one-click client-side redaction before network transmission. Server never stores raw analyzed snippet text.

### 3.5. Denial of Service (Availability)
- **Threat**: Attacker feeds URLs that stream infinite gigabytes, enter redirect loops, or flood API with thousands of scan requests.
- **Mitigation**:
  - Hard stream abort at **2 MB** response size.
  - Timeout limit of **8 seconds** on HTTP and TLS handshakes.
  - Max redirect limit set to 5 hops with SSRF re-validation at each hop.
  - Tiered rate limiters: 120 req/min global IP, 15 req/min scan endpoints, 20 req/min AI assistant.

### 3.6. Elevation of Privilege (Authorization)
- **Threat**: Regular authenticated user manipulates report IDs to view other users' private scan histories.
- **Mitigation**:
  - Supabase Row Level Security (RLS) is enabled on all 18 tables.
  - Every read/write query checks `auth.uid() = user_id`.
  - Service role key is never bundled in frontend code (enforced by Vite build-time scanner).

---

## 4. Threat Mitigation Summary Matrix

| STRIDE Category | Vector | Primary Defense | Verification Test |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Punycode / Typo-squatting | `urlAnalyzer.ts` (Levenshtein + Brand Hash) | `ipClassifier.test.ts` & URL suite |
| **Tampering** | Insecure TLS / Missing CSP | `tlsInspector.ts` + `headerAnalyzer.ts` | Passive header unit tests |
| **Repudiation** | Unlogged activity | `transparencyService.ts` + `reports` table | RLS & audit trail integration |
| **Information Disclosure** | SSRF to private IP/Cloud Metadata | `safeFetch.ts` (Undici pinned DNS lookup) | `tests/security/ssrf.test.ts` (100% pass) |
| **Information Disclosure** | Plaintext PII persistence | Client PII detector + `redactor.ts` | `tests/unit/piiDetector.test.ts` (100% pass) |
| **Denial of Service** | Oversized payloads & Redirect loops | Stream byte counter (2MB) + hop limit (5) | `safeFetch` unit tests |
| **Elevation of Privilege** | IDOR / Tenant Data Leakage | Supabase RLS policies (`auth.uid() = user_id`)| Migration 001 test verification |
