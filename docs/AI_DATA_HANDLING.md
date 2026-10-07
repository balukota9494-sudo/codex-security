# TRUSTGUARD AI — AI DATA HANDLING & GUARDRAILS

This document defines how artificial intelligence models are integrated, safeguarded, and constrained within the TrustGuard AI architecture.

---

## 1. AI Integration Architecture

TrustGuard AI utilizes **Google Gemini Flash** (`gemini-2.5-flash`) via the modern `@google/genai` SDK for natural-language decision support, threat explanation, and privacy guidance.

```
┌─────────────────────────┐
│ User Input (Text / URL) │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Client-Side PII Check   │───[ If secrets detected: Redact via "Protect My Data" ]
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Prompt Boundary Packing │───[ XML tag encapsulation: <user_question>, <context> ]
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Google Gemini Flash     │───[ responseSchema: JSON Schema enforcement ]
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Output Honesty Filter   │───[ Replaces "100% safe" with SAFE_LOOKING / CAUTION ]
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 5-Part Structured UI    │
└─────────────────────────┘
```

---

## 2. Core Guardrails

### 2.1. Client-Side Pre-Redaction
Before text is transmitted to backend AI endpoints, our client-side regex engine tests for:
- Payment card numbers (Luhn checksum validated)
- Social Security Numbers (SSN)
- Bearer tokens, private PEM keys, and API secrets
- Plaintext passwords and emails
Users can click "Protect My Data" to replace these values with tokens like `[REDACTED_CREDIT_CARD]` prior to network transport.

### 2.2. Strict JSON Schema Enforcement
The Gemini client is configured with Google's native `responseSchema` parameter, forcing the model's output to strictly adhere to TypeScript-defined Zod schemas:
- `assistantAnswerSchema`:
  - `summary`: string
  - `immediateActions`: string[]
  - `longTermAdvice`: string[]
  - `whatWeChecked`: string[]
  - `whatWeCouldntCheck`: string[]
  - `confidence`: "HIGH" | "MEDIUM" | "LOW"
If the model produces non-compliant or malformed JSON, the server falls back gracefully to deterministic guidance.

### 2.3. Output Honesty Filter
TrustGuard AI's output pipeline runs all AI-generated text through `server/src/ai/outputFilter.ts`:
- Prohibited phrases:
  - *"100% safe"*
  - *"completely secure"*
  - *"impossible to hack"*
  - *"guaranteed safe"*
  - *"zero risk"*
- Prohibited claims are stripped or replaced with nuanced honesty language (`SAFE_LOOKING`, `LOW_RISK`, `CAUTION`).
- If unverified elements are present, the system guarantees the assessment remains cautious.

### 2.4. Zero Training Guarantee
Under Google Cloud AI Enterprise terms:
- Customer prompts and responses are **not used** to train or fine-tune Google's underlying models.
- Queries are executed statelessly; no conversational threads or identifying profiles are retained by the AI provider.

---

## 3. Deterministic Offline Fallback Engine

In situations where:
- The network connection is lost or offline.
- The Gemini API quota is exceeded or rate-limited.
- An emergency scenario is triggered where latency must be sub-50 milliseconds.

The system switches immediately to `server/src/ai/fallbackGuidance.ts`. This engine serves deterministic, expert-crafted checklists for 8 emergency scenarios:
1. `compromised-account`
2. `stolen-device`
3. `phishing-clicked`
4. `ransomware-scare`
5. `credential-leak`
6. `stalkerware-suspicion`
7. `financial-fraud`
8. `social-engineering`

These recovery steps execute instantly with 100% reliability and zero third-party dependency.
