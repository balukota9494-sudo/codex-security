# TRUSTGUARD AI — DATABASE SCHEMA & MIGRATIONS

This document provides a comprehensive reference for the PostgreSQL database architecture underpinning TrustGuard AI on Supabase Cloud.

---

## 1. Migration Overview

The database schema is defined in a single idempotent migration file:
`supabase/migrations/001_initial_schema.sql`

To apply this migration:
1. **Via Supabase Web Dashboard**:
   - Open [Supabase Project Dashboard](https://supabase.com/dashboard/project/rxyxenrcccxbshcnkygf).
   - Go to **SQL Editor** -> **New query**.
   - Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**.
2. **Via Command Line**:
   - Set `DATABASE_URL=postgres://...` in `.env`.
   - Run: `node supabase/scripts/apply-migrations.mjs`

---

## 2. Custom Enumerations (Types)

| Enum Name | Allowed Values | Description |
| :--- | :--- | :--- |
| `assessment_status` | `SAFE_LOOKING`, `LOW_RISK`, `CAUTION`, `HIGH_RISK`, `CRITICAL_RISK`, `UNKNOWN`, `UNABLE_TO_VERIFY`, `NOT_CHECKED`, `DEMO_DATA` | Radical honesty assessment values. |
| `severity_level` | `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Alert and finding severity levels. |
| `capability_status` | `SUPPORTED`, `RESTRICTED_BY_SANDBOX`, `REQUIRES_PERMISSION`, `UNSUPPORTED` | Browser sandbox capability audit states. |
| `scan_state` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `ABORTED` | Asynchronous scan status lifecycle. |
| `alert_state` | `NEW`, `READ`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED` | User alert status states. |

---

## 3. Table Catalog (18 Tables)

### 3.1. User & Identity
1. `profiles`: Extended user profile attributes (`user_id`, `display_name`, `avatar_url`, `theme_preference`, `role`).
2. `user_settings`: Privacy preferences, colorblind mode, font scale, telemetry consents.
3. `api_quotas`: Daily scan rate limit counters (`daily_scan_count`, `reset_at`).

### 3.2. Scans & Reports
4. `scans`: Master scan execution entries (`target_url`, `scan_type`, `state`, `sha256_hash`, `duration_ms`).
5. `reports`: 9-Element structured report records (`target`, `assessment_status`, `summary`, `visibility_score`, `raw_diagnostics`).
6. `verified_signals`: Individual verified checks associated with a report (`category`, `name`, `evidence`).
7. `unverified_signals`: Honest disclosures of what could not be inspected (`name`, `reason_code`, `explanation`).
8. `recommendations`: Actionable steps linked to reports (`priority_order`, `action_text`, `rationale`).

### 3.3. Privacy & Findings
9. `pii_findings`: Categorized and masked findings (`finding_type`, `masked_preview`, `count`, `severity`). *Note: Zero raw sensitive values stored.*
10. `storage_objects`: Metadata tracker for private storage files (`bucket_id`, `file_path`, `size_bytes`).

### 3.4. Incidents & Alerts
11. `alerts`: Push and in-app security notifications (`title`, `description`, `severity`, `alert_state`).
12. `emergency_incidents`: Emergency checklist interactions (`scenario_id`, `completed_steps_count`, `is_resolved`).

### 3.5. System & Transparency
13. `activity_logs`: User activity and security audit events (`event_type`, `anonymized_user_id`, `metadata`).
14. `transparency_logs`: System audit trail recording what APIs and services accessed what metadata.
15. `capability_audits`: Historical records of browser capability tests.
16. `user_feedback`: User ratings, feedback reports, and false-positive/negative flags.
17. `reputation_cache`: Ephemeral cache of domain reputation scores with strict TTL.
18. `system_metrics`: Aggregate system health, response latencies, and error counters.

---

## 4. Row Level Security (RLS) Policies

Row Level Security is enabled on **every single table**:
- **User Isolation**:
  ```sql
  CREATE POLICY "Users can only view their own data"
    ON reports FOR SELECT
    USING (auth.uid() = user_id);
  ```
- **Service Role Operations**:
  ```sql
  CREATE POLICY "Service role has administrative write access"
    ON reports FOR ALL
    USING (auth.role() = 'service_role');
  ```
- **Public Fixtures**:
  Demo records tagged with `DEMO_DATA` allow read access for unauthenticated exploration.

---

## 5. Storage Buckets & Policies

1. **`avatars` (Public Read, Owner Write)**: User profile avatars capped at 2 MB.
2. **`exports` (Private Access Only)**: User data archives generated via `/api/v1/data/export`. Only accessible by the owning user via short-lived signed URLs.
