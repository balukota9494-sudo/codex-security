# TRUSTGUARD AI — COMPREHENSIVE DEMO SCRIPT

This step-by-step walkthrough is designed for judges, evaluators, and stakeholders to experience all 5 pillars of TrustGuard AI in under 5 minutes.

---

## Pre-Requisites
1. Start the application:
   ```bash
   npm run dev
   ```
2. Open your browser to `http://localhost:5173`.

---

## Walkthrough Steps

### Step 1: Landing Page & Core Philosophy (0:00 - 0:45)
1. **Navigate**: Open `http://localhost:5173`.
2. **Observe**:
   - The headline: *"Security You Can See. Privacy You Can Control. AI You Can Trust."*
   - The Radical Honesty Banner: *"We do not know what we cannot verify, and we never treat unknown information as safe."*
   - The 4 Accessibility themes in the header (Dark, Light, High-Contrast, Colorblind).
3. **Action**: Click **"Try Interactive Demo"** or navigate directly to `/demo`.

---

### Step 2: Radical Honesty & 9-Element Report (0:45 - 1:45)
1. **Navigate**: Go to **Check Website** (`/app/check-website`).
2. **Test 1 — Legitimate Site**:
   - Enter `https://github.com` and click **Analyze**.
   - Note the status: `SAFE_LOOKING` (notice it **does not** say "100% Safe").
   - Inspect the **Visibility Meter** (e.g. 88% Visibility).
   - Review the **Mandatory Advisory** box.
   - Expand **Technical Diagnostic Details** to view TLS cipher, X.509 cert expiration, and HSTS headers.
3. **Test 2 — Homoglyph / Typo-Squatting Site**:
   - Enter `http://paypa1-security-login.com` and click **Analyze**.
   - Note the status: `HIGH_RISK` or `CAUTION`.
   - Verified signals flag: *"Brand Lookalike Detected (PayPal homoglyph)"* and *"Missing HSTS security header"*.
4. **Test 3 — SSRF Boundary Test**:
   - Enter `http://192.168.1.1` or `http://169.254.169.254/latest/meta-data/`.
   - Result: Request blocked immediately with clear error: *"SSRF Blocked: Destination IP is in a private or reserved network range."*

---

### Step 3: Privacy Check & "Protect My Data" Redaction (1:45 - 2:45)
1. **Navigate**: Go to **Privacy Check** (`/app/privacy-check`).
2. **Action**: Paste the following test snippet containing sensitive synthetic credentials:
   ```text
   Hi team, please use card 4532 0150 0000 0007 with SSN 000-12-3456 and API key sec_token_948172948123 to access the test server.
   ```
3. **Observe**:
   - The real-time findings table immediately detects:
     - 1 Credit Card (Luhn checksum passed)
     - 1 US Social Security Number (SSN)
     - 1 Private API Key
4. **Action**: Click the **"Protect My Data (Redact All)"** button.
5. **Observe**:
   - The text in the input box is instantly replaced with safe placeholders:
     `[REDACTED_CREDIT_CARD]`, `[REDACTED_SSN]`, `[REDACTED_API_KEY]`.
   - Zero sensitive tokens remain before transmission.

---

### Step 4: Sandbox Transparency & Blind Spots (2:45 - 3:30)
1. **Navigate**: Go to **Blind Spots** (`/app/blind-spots`).
2. **Observe**:
   - Real-time audit of what the browser sandbox can inspect (User-Agent, cookies, online state, screen resolution).
   - Clear disclosure of what the browser **cannot** inspect:
     - Running OS Processes
     - Installed Antivirus software
     - Local disk filesystem
     - Raw network packets
   - Explains why websites claiming to "Scan your PC for viruses" from a browser tab are misleading users.

---

### Step 5: Trust Assistant & Offline Emergency Response (3:30 - 4:15)
1. **Navigate**: Go to **Ask Assistant** (`/app/ask`).
2. **Action**: Ask a question: *"I clicked a suspicious link from an unknown text message. What should I do?"*
3. **Observe**:
   - The 5-part structured card output:
     1. Executive Summary
     2. Immediate Actions
     3. Long-term Advice
     4. What We Checked
     5. What We Couldn't Check
4. **Navigate**: Go to **Emergency Playbooks** (`/app/emergency`).
5. **Action**: Select **"Compromised Account / Password Breach"**.
6. **Observe**:
   - High-contrast, zero-distraction interactive checklist.
   - Operates entirely offline; no AI latency or network dependency.

---

### Step 6: User Data Rights & Data Export (4:15 - 5:00)
1. **Navigate**: Go to **Your Data** (`/app/your-data`).
2. **Action**: Click **"Export All My Data"**.
   - Instantly downloads a clean JSON archive of all profile and scan records.
3. **Action**: Observe the **"Delete Account & All Data"** option with explicit confirmation safeguards.

---

## Summary of Highlights
- **No Deceptive Claims**: Zero instances of "100% safe" or fake virus scans.
- **Defense in Depth**: Pinned DNS SSRF protection, client-side PII masking.
- **Inclusive by Default**: High-contrast, colorblind, and text scaling support.
- **Reliable in Crisis**: Offline emergency recovery modes.
