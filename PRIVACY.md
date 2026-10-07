# TRUSTGUARD AI — PRIVACY POLICY & ARCHITECTURE

> **Core Promise:** *Privacy You Can Control. We never store what you don't want us to know, and we never sell, share, or train on your personal data.*

---

## 1. Zero Raw Sensitive Data Storage Policy

TrustGuard AI operates on a strict **Zero Raw Storage** architecture. When users paste content for privacy analysis or security inspection:

1. **Client-Side Inspection**: Sensitive patterns are detected directly inside the browser using client-side JavaScript regexes and the Luhn check algorithm before any network payload is dispatched.
2. **"Protect My Data" Redaction**: Users can click "Protect My Data" to replace discovered secrets with masked tokens (`[REDACTED_CREDIT_CARD]`, `[REDACTED_SSN]`, `[REDACTED_API_KEY]`, `[REDACTED_EMAIL]`).
3. **Server-Side Non-Persistence**:
   - The backend server never logs or saves raw analyzed snippet text in the database.
   - Scan records save only cryptographic hashes (`sha256(content)`), token counts, finding categories (e.g., `EMAIL: 2`, `API_KEY: 1`), and assessment timestamps.
   - Database tables enforce column constraints ensuring raw input text columns do not exist in persistent storage.

---

## 2. Pseudonymized Identity & User ID Hashing

To decouple system activity from real user identities:
- System audit and telemetry logs store an `anonymized_user_id` generated via HMAC-SHA256:
  ```typescript
  anonymizedUserId = crypto.createHmac("sha256", USER_HASH_SALT).update(userId).digest("hex");
  ```
- This prevents database administrators or system logs from linking scan activities or emergency lookups directly to an individual's email address without the protected server salt.

---

## 3. Data Retention Lifecycle & Automated Purges

TrustGuard AI adheres to strict data minimization principles:

| Data Type | Retention Period | Purge Mechanism |
| :--- | :--- | :--- |
| **Website & Link Scan Results** | 30 Days | Nightly cron job (`server/src/services/retentionJobs.ts`) purges records older than 30 days. |
| **User Activity Logs** | 90 Days | Hard-deleted automatically after 90 days. |
| **Export Download Packages** | 24 Hours | Temporary signed storage URLs and generated JSON archives expire in 24 hours. |
| **Temporary Scan Caches** | 1 Hour | Memory LRU cache pruned hourly. |
| **Emergency Checklists** | 0 Days (Ephemeral) | Stored in browser memory / localStorage only. Zero server persistence. |

---

## 4. User Rights: GDPR & CCPA Compliance

TrustGuard AI provides immediate, self-service tools for international data privacy compliance:

### 1. Right to Access & Data Portability (GDPR Art. 15 & 20 / CCPA § 1798.100)
- Users can visit `/app/your-data` at any time and click **"Export All My Data"**.
- The server generates an encrypted JSON archive containing all user profile attributes, scan records, alerts, and settings.
- The download link expires automatically after 24 hours.

### 2. Right to Erasure / "Right to Be Forgotten" (GDPR Art. 17 / CCPA § 1798.105)
- Users can visit `/app/your-data` and select **"Delete Account & All Data"**.
- This triggers a cascading deletion across all 18 database tables (`profiles`, `scans`, `reports`, `alerts`, `user_settings`, `api_quotas`, `storage_objects`).
- Storage buckets (`avatars`, `exports`) are scrubbed immediately.
- Once confirmed, deletion is permanent and irrecoverable.

### 3. Right to Rectification (GDPR Art. 16)
- Users can update their profile information and display preferences at any time from `/app/profile`.

---

## 5. AI Data Handling & Training Guarantees

- **No Model Training**: TrustGuard AI uses Google Gemini Flash under enterprise API terms. Your prompts and scan contents are **never** used to train Google's models or any proprietary models.
- **Pre-Redaction Guard**: Sensitive inputs detected by our scanner are masked prior to being transmitted to AI endpoints.
- **Stateless AI Processing**: Prompts sent to Gemini are processed statelessly without thread persistence on the AI provider side.

---

## 6. Cookies & Tracking

- TrustGuard AI uses zero third-party tracking scripts, zero advertising beacons, and zero cross-site trackers.
- Essential cookies are strictly limited to Supabase authentication session tokens.
