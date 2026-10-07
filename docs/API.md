# TRUSTGUARD AI — REST API SPECIFICATION

**Base URL**: `http://localhost:3001/api/v1` (Production: `https://api.trustguard.ai/api/v1`)
**Content-Type**: `application/json`

---

## 1. Response Envelope Format

All responses from TrustGuard AI adhere to a standardized JSON envelope:

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "requestId": "req_a1b2c3d4e5",
    "timestamp": "2026-10-07T10:45:00.000Z"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT | SSRF_BLOCKED | RATE_LIMIT_EXCEEDED | UNAUTHORIZED | NOT_FOUND | SERVER_ERROR",
    "message": "Human-readable explanation of error.",
    "details": {}
  },
  "meta": {
    "requestId": "req_a1b2c3d4e5",
    "timestamp": "2026-10-07T10:45:00.000Z"
  }
}
```

---

## 2. Authentication

Endpoints that modify state or return personalized history require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <supabase_jwt_token>
```
If unauthenticated, public or demo endpoints provide safe fallback defaults.

---

## 3. Endpoints Catalog

### 3.1. System & Health

#### `GET /api/v1/health`
Returns service availability, uptime, and database connection status.
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "uptime": 1420.5,
    "timestamp": "2026-10-07T10:45:00.000Z",
    "services": {
      "database": "connected",
      "ai": "configured"
    }
  }
}
```

---

### 3.2. Scanning Endpoints

#### `POST /api/v1/scans/website`
Performs deep passive reconnaissance on a website domain or URL.
- **Auth**: Optional (enforces quota if unauthenticated)
- **Body**:
```json
{
  "url": "https://example.com",
  "consentThirdPartyReputation": false
}
```
- **Response**: Full 9-Element Trust Report object.

#### `POST /api/v1/scans/link`
Analyzes a link for redirects, lookalike domains, punycode characters, and suspicious URL structures.
- **Auth**: Optional
- **Body**:
```json
{
  "url": "http://paypa1-security-check.com/login",
  "expandShortlinks": true
}
```
- **Response**: 9-Element Trust Report object.

#### `POST /api/v1/scans/privacy`
Analyzes text snippets for sensitive data (PII, API keys, passwords, credentials).
- **Auth**: Optional
- **Body**:
```json
{
  "content": "Contact me at user@example.com with key sec_token_12345",
  "redact": true
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "findingsCount": 2,
    "findings": [
      { "type": "EMAIL", "preview": "u***@example.com", "severity": "LOW" },
      { "type": "API_KEY", "preview": "sk-l***12345", "severity": "HIGH" }
    ],
    "redactedContent": "Contact me at [REDACTED_EMAIL] with key [REDACTED_API_KEY]"
  }
}
```

---

### 3.3. Trust AI Assistant

#### `POST /api/v1/assistant/chat`
Ask security and privacy questions with guaranteed 5-part structured responses.
- **Auth**: Optional
- **Body**:
```json
{
  "message": "I received an SMS claiming my postal package is suspended.",
  "context": {}
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "summary": "This is a widespread smishing (SMS phishing) lure designed to steal card details.",
    "immediateActions": ["Do not click the link", "Delete the message", "Block the sender"],
    "longTermAdvice": ["Verify packages only via the official carrier app or tracking number"],
    "whatWeChecked": ["Known postal smishing patterns", "Generic urgency lures"],
    "whatWeCouldntCheck": ["The exact origin of the sender's phone number without carriers' logs"],
    "confidence": "HIGH"
  }
}
```

---

### 3.4. Emergency System

#### `GET /api/v1/emergency/scenarios`
List all 8 available pre-compiled emergency playbooks.
- **Auth**: None
- **Response**: Array of scenario metadata (`id`, `title`, `severity`, `summary`).

#### `GET /api/v1/emergency/scenarios/:id`
Fetch the deterministic, offline-capable recovery checklist for a scenario (e.g. `compromised-account`, `stolen-device`, `phishing-clicked`).
- **Auth**: None
- **Response**: Complete step-by-step checklist with priority order, verification steps, and emergency hotlines.

---

### 3.5. Capabilities & Sandbox Transparency

#### `GET /api/v1/capabilities/evaluate`
Returns what the browser environment can vs. cannot examine.
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "webApiSupported": ["UserAgent", "CookiesEnabled", "OnlineStatus", "ClipboardPermission"],
    "systemRestricted": ["RunningProcesses", "InstalledApplications", "LocalDiskScan", "RawNetworkPackets"],
    "explanation": "Web browser sandboxes deliberately isolate websites from operating system internals for security."
  }
}
```

#### `GET /api/v1/blind-spots`
Returns the complete radical honesty matrix of blind spots inherent to passive web analysis.
- **Auth**: None

---

### 3.6. User Rights & Data Management

#### `GET /api/v1/data/export`
Generates a downloadable JSON package of all user data.
- **Auth**: Required
- **Response**: Download URL or direct JSON payload containing profile, scans, alerts, and settings.

#### `DELETE /api/v1/data/delete-account`
Initiates complete, permanent deletion of user account and all associated records.
- **Auth**: Required
- **Body**: `{ "confirm": true }`
- **Response**: `{ "success": true, "message": "Account and all associated records have been permanently deleted." }`

---

### 3.7. Alerts & History

#### `GET /api/v1/alerts`
Fetch user security notifications and alerts.
- **Auth**: Required
- **Query Params**: `status=unread|all`, `limit=20`

#### `PATCH /api/v1/alerts/:id`
Mark alert as read, acknowledged, or resolved.
- **Auth**: Required
- **Body**: `{ "status": "RESOLVED" }`

---

### 3.8. Admin & Audit

#### `GET /api/v1/admin/overview`
System health, scan volumes, and error rate telemetry.
- **Auth**: Admin JWT required (enforced via `adminOnly` middleware).
