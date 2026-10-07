# TRUSTGUARD AI — DATA RETENTION POLICY & AUTOMATED PURGES

> **Rule:** *We keep data only as long as necessary to serve user decision support, and not a single second longer.*

---

## 1. Retention Matrix

| Category | Storage Location | Retention Duration | Deletion Mechanism |
| :--- | :--- | :--- | :--- |
| **Website & Link Scans** | PostgreSQL `scans`, `reports` | 30 Days | Scheduled nightly job (`retentionJobs.ts`) executes `DELETE FROM scans WHERE created_at < NOW() - INTERVAL '30 days'`. Cascading foreign keys remove associated signals and recommendations. |
| **Privacy Check Findings** | PostgreSQL `pii_findings` | 30 Days | Scheduled nightly job purges masked metadata older than 30 days. |
| **User Activity Logs** | PostgreSQL `activity_logs` | 90 Days | Hard-deleted automatically after 90 days. |
| **User Data Exports** | Supabase Storage (`exports/`) | 24 Hours | Temporary signed download URLs and backend zip files are expunged after 24 hours. |
| **Domain Reputation Cache** | PostgreSQL `reputation_cache` | 1 Hour | Ephemeral cache entries are pruned upon expiration or when older than 1 hour. |
| **User Account & Profile** | PostgreSQL `profiles`, `auth.users` | Until User-Initiated Deletion | Self-service deletion via `/api/v1/data/delete-account` triggers immediate cascading hard delete. |

---

## 2. Hard Deletion vs. Soft Deletion

Many web applications use "soft delete" (setting `deleted_at = NOW()` while keeping all user data indefinitely).

**TrustGuard AI uses Hard Deletion**:
- When a user deletes a scan or requests account deletion, SQL `DELETE` queries physically remove the records from the PostgreSQL database tables.
- Linked storage objects (such as exported archives) are physically removed from storage buckets.
- Backup snapshots on Supabase rotate and overwrite on a fixed cycle.

---

## 3. Automated Retention Service Implementation

The automated retention engine is defined in `server/src/services/retentionJobs.ts`:

```typescript
export async function runRetentionPurge(): Promise<RetentionPurgeResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Purge scans older than 30 days
  // 2. Purge activity logs older than 90 days
  // 3. Purge expired export archives older than 24 hours
  // 4. Purge expired reputation cache entries
}
```

This service can be triggered on a cron schedule or via system administration tools.
