# TRUSTGUARD AI — SECURITY POLICY & ARCHITECTURE

## 1. Security Overview

TrustGuard AI is engineered to protect users from deceptive security practices, sensitive data leakage, and automated cyber threats. Because TrustGuard AI operates in the security and privacy domain, our own security architecture is designed with defense-in-depth, strict boundary isolation, and radical transparency.

---

## 2. Reporting a Vulnerability

We welcome security researchers, engineers, and users who identify vulnerabilities to report them responsibly.

- **Primary Contact**: `security@trustguard.ai`
- **PGP Key Fingerprint**: `9C4F 88B1 E571 A039 423D  C92E 8A55 2D3F 71B9 0041`
- **Initial Acknowledgment**: Within 24 hours
- **Triage & Remediation Timeline**: Within 72 hours for critical/high vulnerabilities; 7 business days for medium/low issues.
- **Safe Harbor**: We will not take legal action against security researchers who report vulnerabilities in good faith following standard responsible disclosure practices, provided:
  - You do not access or attempt to access other users' data.
  - You do not execute denial-of-service (DoS/DDoS) attacks.
  - You do not exploit discovered vulnerabilities beyond proof-of-concept verification.

---

## 3. Server-Side Request Forgery (SSRF) Defense Architecture

Because TrustGuard AI offers a passive website and link analyzer, attackers may attempt to input URLs pointing to internal networks (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.1`), link-local metadata services (`169.254.169.254`), container interfaces, or use DNS rebinding.

TrustGuard AI implements a multi-layer SSRF defense in `server/src/services/safeFetch.ts` and `server/src/services/ipClassifier.ts`:

### Layer 1: Protocol and Scheme Whitelisting
- Only `http:` and `https:` protocols are permitted.
- `file:`, `ftp:`, `javascript:`, `data:`, `gopher:`, and arbitrary URI schemes are rejected at parse time.
- Standard ports 80 and 443 are enforced. Non-standard ports (e.g., `8080`, `22`, `6379`, `3306`, `27017`) are rejected to prevent internal port scanning.

### Layer 2: Comprehensive IP & Hostname Classification
Hostnames are classified against exhaustive private and reserved ranges:
- **Loopback**: `127.0.0.0/8`, `::1`
- **Private Networks**: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`
- **Link-Local & Cloud Metadata**: `169.254.0.0/16`, `fe80::/10` (includes AWS/GCP/Azure instance metadata endpoints)
- **Carrier-Grade NAT**: `100.64.0.0/10`
- **Special Purpose & Broadcast**: `0.0.0.0/8`, `224.0.0.0/4` (multicast), `240.0.0.0/4` (reserved), `255.255.255.255/32`
- **Test Networks**: `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`
- **Numeric & Obfuscated IP Formats**: Decimals (e.g. `2130706433`), Octals (`0177.0.0.1`), and Hexadecimals (`0x7f000001`) are automatically parsed and resolved to their standard IPv4 representations.

### Layer 3: DNS Lookup Pinning (Anti-DNS Rebinding)
Standard fetch utilities resolve DNS once for policy checks and again during TCP handshake, allowing attackers to exploit DNS rebinding (returning a public IP first, then an internal IP).

TrustGuard AI prevents DNS rebinding using Undici's custom dispatcher with pinned DNS resolution:
1. Target hostname is resolved using Node's `dns.promises.lookup({ all: true })`.
2. Every resolved IPv4 and IPv6 address is evaluated against `isIpAllowedForPublicFetch()`. If any resolved address falls in a private or reserved range, the entire request is rejected immediately.
3. The verified public IP is pinned for the actual HTTP connection, ensuring the connection is made exclusively to the verified IP.

### Layer 4: Resource & Timing Bounds
- Maximum response size: **2 MB**. Requests exceeding this threshold are aborted mid-stream.
- Request timeout: **8,000 ms** hard abort.
- Redirect limit: Maximum 5 redirects; each redirect hop is re-validated through the full SSRF pipeline before following.
- Safe User-Agent: Custom identifiable User-Agent `TrustGuardAI-SecurityScanner/1.0 (+https://trustguard.ai/bot)`.

---

## 4. Prompt Injection & AI Safety Defense

TrustGuard AI connects to Google Gemini Flash for natural-language analysis. To prevent indirect prompt injection, jailbreaks, and manipulative inputs, the system enforces the following defenses:

### Delimiter Encapsulation
Untrusted user inputs and webpage snippet extractions are strictly bounded using XML-style delimiters (`<user_question>` and `<analyzed_content>`) inside system prompts. The model is instructed to treat all content within these blocks strictly as untrusted text to be audited, not instructions to be executed.

### Output Verification & Vocabulary Enforcement
- The model's output is forced to adhere to strict JSON schemas via Gemini's `responseSchema` property.
- Any output attempting to claim "100% safe", "completely secure", or "impossible to hack" is filtered and replaced with radical honesty terms (`SAFE_LOOKING`, `LOW_RISK`, `CAUTION`, `HIGH_RISK`).
- If an unknown signal is detected, `assertNotSafeWhenUnknown()` guarantees the report status remains `UNKNOWN` or `CAUTION`.

### Deterministic Offline Emergency Fallback
Emergency playbooks (`server/src/ai/fallbackGuidance.ts`) bypass the AI layer entirely if the AI service fails or if the user is in an offline emergency scenario. Deterministic, expert-curated security recovery steps are returned instantly with zero network dependencies.

---

## 5. Secret Management & Zero Client Exposure

- **Vite Build-Time Guard**: The client `vite.config.ts` incorporates an automated Rollup plugin that scans all bundle chunks for accidental inclusions of backend secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `USER_HASH_SALT`). If any matching key pattern is found, the build fails immediately.
- **Frontend Environment**: The frontend application only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Supabase Row Level Security (RLS) protects all database operations on the client.
- **Service Role Key Isolation**: `SUPABASE_SERVICE_ROLE_KEY` is exclusively utilized in backend services for system administrative tasks (such as scheduled retention purges and audit log insertions) and is never accessible through API client tokens.

---

## 6. Rate Limiting Strategy

To prevent denial of service and API abuse, express middleware enforces tiered rate limits:
- **Global IP Limiter**: 120 requests per minute per IP address.
- **Scanner Limiter**: 15 website or link scans per minute per IP/user to prevent external host flooding.
- **AI Assistant Limiter**: 20 requests per minute per user to prevent Gemini token exhaustion.
- **Daily Quotas**: Authenticated users receive 100 deep scans per day; unauthenticated visitors receive 10 demo scans per day.
