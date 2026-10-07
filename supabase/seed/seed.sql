-- TRUSTGUARD AI: Synthetic Demo Seed Data
-- Marked clearly with is_demo = true and DEMO_DATA status
-- Zero real user data. All values are synthetic fixtures for demonstration.

-- 1. Demo User Profile (Deterministic UUID)
INSERT INTO public.profiles (user_id, display_name, role, theme_preference)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Demo Explorer',
  'user',
  'dark'
) ON CONFLICT (user_id) DO NOTHING;

-- 2. Demo User Settings
INSERT INTO public.user_settings (user_id, colorblind_mode, font_scale, allow_telemetry)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'none',
  'medium',
  false
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Synthetic Demo Scan 1: Well-Configured Public Domain (GitHub)
INSERT INTO public.scans (
  id,
  user_id,
  target_url,
  scan_type,
  state,
  sha256_hash,
  duration_ms,
  is_demo
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'https://github.com',
  'WEBSITE',
  'COMPLETED',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  412,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reports (
  id,
  scan_id,
  user_id,
  target,
  assessment_status,
  summary,
  visibility_score,
  is_demo,
  raw_diagnostics
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'https://github.com',
  'SAFE_LOOKING',
  'Target presents valid modern TLS encryption, strict transport security (HSTS with preload), and well-configured security headers. No brand impersonation detected.',
  92,
  true,
  '{"tlsVersion": "TLSv1.3", "cipher": "TLS_AES_128_GCM_SHA256", "issuer": "DigiCert Global Root G2", "hsts": true, "csp": true, "xfo": "DENY"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.verified_signals (report_id, category, name, evidence, severity) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ENCRYPTION', 'Strict Transport Security (HSTS)', 'max-age=31536000; includeSubDomains; preload', 'INFO'),
  ('11111111-1111-1111-1111-111111111111', 'IDENTITY', 'Valid TLS Certificate', 'Issued by DigiCert Global G2, valid for 280 more days', 'INFO'),
  ('11111111-1111-1111-1111-111111111111', 'HEADERS', 'Content Security Policy (CSP)', 'default-src none; strict script whitelisting active', 'INFO'),
  ('11111111-1111-1111-1111-111111111111', 'NETWORK', 'Public Global IP', '140.82.121.4 (AS36459 GitHub, Inc.)', 'INFO')
ON CONFLICT DO NOTHING;

INSERT INTO public.unverified_signals (report_id, name, reason_code, explanation) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Backend Server Code', 'SANDBOX_LIMIT', 'External HTTP inspection cannot examine internal backend application source code or database configurations.'),
  ('11111111-1111-1111-1111-111111111111', 'Server Zero-Days', 'THEORETICAL_LIMIT', 'Unpublished vulnerabilities cannot be detected through passive header analysis.')
ON CONFLICT DO NOTHING;

INSERT INTO public.recommendations (report_id, priority_order, action_text, rationale) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 'Continue normal usage', 'Public security posture adheres to best practices.'),
  ('11111111-1111-1111-1111-111111111111', 2, 'Enable Hardware Key 2FA on account', 'Hardware security keys (FIDO2/WebAuthn) protect against credential phishing.')
ON CONFLICT DO NOTHING;

-- 4. Synthetic Demo Scan 2: Typo-Squatting Phishing Lookalike
INSERT INTO public.scans (
  id,
  user_id,
  target_url,
  scan_type,
  state,
  sha256_hash,
  duration_ms,
  is_demo
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'http://paypa1-security-check.com/login',
  'LINK',
  'COMPLETED',
  'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  850,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reports (
  id,
  scan_id,
  user_id,
  target,
  assessment_status,
  summary,
  visibility_score,
  is_demo,
  raw_diagnostics
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'http://paypa1-security-check.com/login',
  'HIGH_RISK',
  'Critical homoglyph lookalike of PayPal brand detected. Transmitting over plaintext HTTP without TLS encryption. Insecure password field discovered.',
  78,
  true,
  '{"lookalikeBrand": "PayPal", "levenshteinDistance": 1, "hasPasswordInput": true, "insecureForm": true, "httpOnly": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.verified_signals (report_id, category, name, evidence, severity) VALUES
  ('22222222-2222-2222-2222-222222222222', 'IDENTITY', 'Brand Lookalike Detected', 'paypa1 resembles PayPal (Levenshtein distance = 1)', 'CRITICAL'),
  ('22222222-2222-2222-2222-222222222222', 'ENCRYPTION', 'No Encryption (Plaintext HTTP)', 'Port 80 HTTP connection without TLS certificate', 'HIGH'),
  ('22222222-2222-2222-2222-222222222222', 'FORM', 'Insecure Password Form Submission', 'HTML form action points to non-HTTPS recipient endpoint', 'CRITICAL')
ON CONFLICT DO NOTHING;

INSERT INTO public.unverified_signals (report_id, name, reason_code, explanation) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Server Hosting Operator', 'WHOIS_PRIVACY', 'Domain registrant data is obscured behind privacy proxy service.')
ON CONFLICT DO NOTHING;

INSERT INTO public.recommendations (report_id, priority_order, action_text, rationale) VALUES
  ('22222222-2222-2222-2222-222222222222', 1, 'DO NOT enter credentials or passwords', 'This website is an active credential harvesting attempt.'),
  ('22222222-2222-2222-2222-222222222222', 2, 'Close browser tab immediately', 'Prevent background scripts or clickjacking interactions.'),
  ('22222222-2222-2222-2222-222222222222', 3, 'Change PayPal password if already submitted', 'Initiate emergency password reset via the genuine paypal.com domain.')
ON CONFLICT DO NOTHING;

-- 5. Demo Alerts
INSERT INTO public.alerts (
  id,
  user_id,
  title,
  description,
  severity,
  alert_state,
  source_type,
  source_id
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'Phishing Lookalike Detected',
  'A scan on paypa1-security-check.com identified brand impersonation and insecure password transmission.',
  'HIGH',
  'NEW',
  'SCAN',
  '22222222-2222-2222-2222-222222222222'
) ON CONFLICT (id) DO NOTHING;
