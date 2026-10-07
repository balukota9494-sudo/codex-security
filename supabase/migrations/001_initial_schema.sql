-- TRUSTGUARD AI: Complete Initial Database Schema, RLS Policies, and Demo Seed
-- Migration: 001_initial_schema.sql

-- 1. Extensions & Helpers
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- 2. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'assessment_status') then
    create type assessment_status as enum (
      'SAFE_LOOKING','LOW_RISK','CAUTION','HIGH_RISK','CRITICAL_RISK',
      'UNKNOWN','UNABLE_TO_VERIFY','NOT_CHECKED','DEMO_DATA'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'capability_status') then
    create type capability_status as enum ('available','limited','unavailable','unknown');
  end if;
  if not exists (select 1 from pg_type where typname = 'severity_level') then
    create type severity_level as enum ('info','low','medium','high','critical');
  end if;
  if not exists (select 1 from pg_type where typname = 'scan_state') then
    create type scan_state as enum ('queued','running','completed','failed','blocked');
  end if;
  if not exists (select 1 from pg_type where typname = 'alert_state') then
    create type alert_state as enum ('open','dismissed','resolved');
  end if;
end $$;

-- 3. Profiles & User Preferences
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_path text check (char_length(avatar_path) <= 300),
  language text not null default 'en' check (char_length(language) <= 10),
  mode text not null default 'standard' check (mode in ('standard','simple','teen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark','high_contrast','colorblind')),
  text_size text not null default 'medium' check (text_size in ('small','medium','large','xlarge')),
  reduced_motion boolean not null default false,
  store_history boolean not null default false,
  store_ai_history boolean not null default false,
  ai_retention_days int not null default 30 check (ai_retention_days between 1 and 365),
  allow_reputation_lookup boolean not null default false,
  allow_ai_processing boolean not null default false,
  monitoring_paused boolean not null default false,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_prefs_updated on public.user_preferences;
create trigger trg_prefs_updated before update on public.user_preferences
  for each row execute function public.set_updated_at();

create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in
    ('history_storage','ai_processing','reputation_lookup','usage_sync','analytics')),
  granted boolean not null,
  policy_version text not null check (char_length(policy_version) <= 20),
  created_at timestamptz not null default now()
);
create index if not exists idx_privacy_consents_user_created on public.privacy_consents (user_id, created_at desc);

-- 4. Scans & Findings
create table if not exists public.website_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_url_safe text not null check (char_length(attempted_url_safe) <= 512),
  final_url_safe text check (char_length(final_url_safe) <= 512),
  hostname text not null check (char_length(hostname) <= 255),
  state scan_state not null default 'queued',
  status assessment_status not null default 'NOT_CHECKED',
  assessment text check (assessment in ('COMPLETE','SCAN_INCOMPLETE','UNSAFE_REDIRECT_BLOCKED','SSRF_BLOCKED')),
  confidence numeric(3,2) check (confidence between 0 and 1),
  failure_category text check (char_length(failure_category) <= 60),
  report jsonb not null default '{}'::jsonb,
  sources text[] not null default '{}',
  limitations text[] not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_website_scans_user_created on public.website_scans (user_id, created_at desc);

drop trigger if exists trg_ws_updated on public.website_scans;
create trigger trg_ws_updated before update on public.website_scans
  for each row execute function public.set_updated_at();

create table if not exists public.website_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.website_scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_key text not null check (char_length(check_key) <= 60),
  category text not null check (char_length(category) <= 40),
  severity severity_level not null,
  capability capability_status not null,
  title text not null check (char_length(title) <= 200),
  plain_explanation text not null check (char_length(plain_explanation) <= 1000),
  technical_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_website_findings_user on public.website_findings (user_id, created_at desc);
create index if not exists idx_website_findings_scan on public.website_findings (scan_id);

create table if not exists public.link_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_app text not null check (source_app in
    ('whatsapp','sms','email','telegram','instagram','social','browser','other')),
  attempted_url_safe text not null check (char_length(attempted_url_safe) <= 512),
  hostname text not null check (char_length(hostname) <= 255),
  status assessment_status not null default 'NOT_CHECKED',
  indicators jsonb not null default '[]'::jsonb,
  report jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_link_scans_user on public.link_scans (user_id, created_at desc);

-- 5. Privacy Scans (No raw input column stored!)
create table if not exists public.privacy_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_length int not null check (input_length between 0 and 20000),
  finding_count int not null default 0,
  status assessment_status not null default 'NOT_CHECKED',
  ai_used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_privacy_scans_user on public.privacy_scans (user_id, created_at desc);

create table if not exists public.privacy_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.privacy_scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pii_type text not null check (char_length(pii_type) <= 40),
  masked_preview text not null check (char_length(masked_preview) <= 80),
  severity severity_level not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_privacy_findings_user on public.privacy_findings (user_id, created_at desc);
create index if not exists idx_privacy_findings_scan on public.privacy_findings (scan_id);

-- 6. Alerts
create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null check (char_length(dedupe_key) <= 128),
  event_type text not null check (char_length(event_type) <= 60),
  severity severity_level not null,
  state alert_state not null default 'open',
  what_happened text not null check (char_length(what_happened) <= 500),
  why_it_matters text not null check (char_length(why_it_matters) <= 800),
  evidence jsonb not null default '[]'::jsonb,
  what_to_do text[] not null default '{}',
  source text not null check (char_length(source) <= 60),
  related_scan_id uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index if not exists idx_security_alerts_user on public.security_alerts (user_id, created_at desc);

drop trigger if exists trg_alerts_updated on public.security_alerts;
create trigger trg_alerts_updated before update on public.security_alerts
  for each row execute function public.set_updated_at();

-- 7. AI Conversations & Messages
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text check (char_length(title) <= 120),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_conv_user on public.ai_conversations (user_id, created_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content_redacted text not null check (char_length(content_redacted) <= 8000),
  risk_level text check (risk_level in ('low','medium','high','critical','unknown')),
  was_fallback boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_messages_conv on public.ai_messages (conversation_id, created_at);
create index if not exists idx_ai_messages_user on public.ai_messages (user_id, created_at desc);

-- 8. Transparency, Storage & Capabilities
create table if not exists public.transparency_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) <= 60),
  summary text not null check (char_length(summary) <= 300),
  data_sent_to text[] not null default '{}',
  data_not_accessed text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_transparency_events_user on public.transparency_events (user_id, created_at desc);

create table if not exists public.storage_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  scans_bytes bigint not null default 0,
  alerts_bytes bigint not null default 0,
  ai_bytes bigint not null default 0,
  avatar_bytes bigint not null default 0,
  exports_bytes bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.device_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capability_key text not null check (char_length(capability_key) <= 60),
  status capability_status not null,
  source text not null,
  permission_used text,
  confidence numeric(3,2) check (confidence between 0 and 1),
  limitations text[] not null default '{}',
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_device_assessments_user on public.device_assessments (user_id, created_at desc);

create table if not exists public.security_blind_spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capability_key text not null check (char_length(capability_key) <= 60),
  status capability_status not null,
  reason text not null check (char_length(reason) <= 500),
  can_see text[] not null default '{}',
  cannot_see text[] not null default '{}',
  required_permission text,
  user_action text,
  created_at timestamptz not null default now(),
  unique (user_id, capability_key)
);

-- 9. Exports, Feedback & Auditing
create table if not exists public.data_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null check (char_length(storage_path) <= 300),
  size_bytes bigint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_data_exports_user on public.data_exports (user_id, created_at desc);

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug','false_result','suggestion','privacy','other')),
  message_redacted text not null check (char_length(message_redacted) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_hash text,
  action text not null check (char_length(action) <= 80),
  resource text check (char_length(resource) <= 80),
  request_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_events_created on public.audit_events (created_at desc);

-- 10. Admin Anonymized Views
create or replace view public.admin_scan_aggregates as
  select date_trunc('day', created_at) as day, status, count(*) as scans
  from public.website_scans where is_demo = false group by 1,2;

create or replace view public.admin_alert_aggregates as
  select date_trunc('day', created_at) as day, event_type, severity, count(*) as alerts
  from public.security_alerts where is_demo = false group by 1,2,3;

revoke all on public.admin_scan_aggregates, public.admin_alert_aggregates from anon, authenticated;

-- 11. Auth Trigger (Automatically create profiles, preferences & storage usage)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, display_name, language, mode)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'TrustGuard User'), 'en', 'standard')
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.storage_usage (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. Enable Row Level Security (RLS) on all tables
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_preferences','privacy_consents','website_scans','website_findings',
    'link_scans','privacy_scans','privacy_findings','security_alerts','ai_conversations',
    'ai_messages','transparency_events','storage_usage','device_assessments',
    'security_blind_spots','data_exports','user_feedback','audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- 13. RLS Policies
-- Profiles
drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- User Preferences
drop policy if exists "prefs_owner_all" on public.user_preferences;
create policy "prefs_owner_all" on public.user_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Privacy Consents (Append-only for users)
drop policy if exists "consents_owner_select" on public.privacy_consents;
create policy "consents_owner_select" on public.privacy_consents
  for select using (user_id = auth.uid());
drop policy if exists "consents_owner_insert" on public.privacy_consents;
create policy "consents_owner_insert" on public.privacy_consents
  for insert with check (user_id = auth.uid());

-- Website Scans
drop policy if exists "website_scans_owner_all" on public.website_scans;
create policy "website_scans_owner_all" on public.website_scans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Website Findings
drop policy if exists "website_findings_owner_select" on public.website_findings;
create policy "website_findings_owner_select" on public.website_findings
  for select using (user_id = auth.uid());
drop policy if exists "website_findings_owner_insert" on public.website_findings;
create policy "website_findings_owner_insert" on public.website_findings
  for insert with check (user_id = auth.uid() and exists (
    select 1 from public.website_scans s where s.id = scan_id and s.user_id = auth.uid()
  ));
drop policy if exists "website_findings_owner_delete" on public.website_findings;
create policy "website_findings_owner_delete" on public.website_findings
  for delete using (user_id = auth.uid());

-- Link Scans
drop policy if exists "link_scans_owner_all" on public.link_scans;
create policy "link_scans_owner_all" on public.link_scans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Privacy Scans
drop policy if exists "privacy_scans_owner_all" on public.privacy_scans;
create policy "privacy_scans_owner_all" on public.privacy_scans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Privacy Findings
drop policy if exists "privacy_findings_owner_select" on public.privacy_findings;
create policy "privacy_findings_owner_select" on public.privacy_findings
  for select using (user_id = auth.uid());
drop policy if exists "privacy_findings_owner_insert" on public.privacy_findings;
create policy "privacy_findings_owner_insert" on public.privacy_findings
  for insert with check (user_id = auth.uid() and exists (
    select 1 from public.privacy_scans s where s.id = scan_id and s.user_id = auth.uid()
  ));
drop policy if exists "privacy_findings_owner_delete" on public.privacy_findings;
create policy "privacy_findings_owner_delete" on public.privacy_findings
  for delete using (user_id = auth.uid());

-- Security Alerts
drop policy if exists "alerts_owner_all" on public.security_alerts;
create policy "alerts_owner_all" on public.security_alerts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AI Conversations & Messages
drop policy if exists "ai_conv_owner_all" on public.ai_conversations;
create policy "ai_conv_owner_all" on public.ai_conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ai_messages_owner_select" on public.ai_messages;
create policy "ai_messages_owner_select" on public.ai_messages
  for select using (user_id = auth.uid());
drop policy if exists "ai_messages_owner_insert" on public.ai_messages;
create policy "ai_messages_owner_insert" on public.ai_messages
  for insert with check (user_id = auth.uid() and exists (
    select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()
  ));
drop policy if exists "ai_messages_owner_delete" on public.ai_messages;
create policy "ai_messages_owner_delete" on public.ai_messages
  for delete using (user_id = auth.uid());

-- Transparency Events
drop policy if exists "transparency_owner_all" on public.transparency_events;
create policy "transparency_owner_all" on public.transparency_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Storage Usage (Users can select; updates via service role or trigger)
drop policy if exists "storage_usage_owner_select" on public.storage_usage;
create policy "storage_usage_owner_select" on public.storage_usage
  for select using (user_id = auth.uid());

-- Device Assessments & Blind Spots
drop policy if exists "device_assessments_owner_all" on public.device_assessments;
create policy "device_assessments_owner_all" on public.device_assessments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "blind_spots_owner_all" on public.security_blind_spots;
create policy "blind_spots_owner_all" on public.security_blind_spots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Data Exports & Feedback
drop policy if exists "exports_owner_all" on public.data_exports;
create policy "exports_owner_all" on public.data_exports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "feedback_owner_all" on public.user_feedback;
create policy "feedback_owner_all" on public.user_feedback
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Storage Buckets Configuration (avatars & exports)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false), ('exports', 'exports', false)
on conflict (id) do nothing;

drop policy if exists "avatars_owner_rw" on storage.objects;
create policy "avatars_owner_rw" on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "exports_owner_read" on storage.objects;
create policy "exports_owner_read" on storage.objects for select
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
