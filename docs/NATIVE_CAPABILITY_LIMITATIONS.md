# TRUSTGUARD AI — NATIVE CAPABILITY LIMITATIONS & SANDBOX TRANSPARENCY

> **Fundamental Principle:** *"A web browser is a security sandbox. Any website claiming to scan your hard drive, detect viruses in your operating system, or inspect other running applications is deceiving you."*

---

## 1. The Browser Sandbox Boundary

Web browsers are explicitly designed around the **Same-Origin Policy** and process isolation. Web pages run within an unprivileged sandbox that strictly prevents websites from accessing host operating system internals.

TrustGuard AI is a web application. We believe the cybersecurity industry has harmed consumer trust by displaying animated progress bars claiming to "Scan your PC for threats" inside a web browser tab. TrustGuard AI rejects these fraudulent practices and explicitly discloses what a web application can and cannot do.

---

## 2. Capabilities Comparison Matrix

| Security Domain | What TrustGuard AI (Web) CAN Verify | What Web Applications CANNOT Verify (Impossible via Web Sandbox) |
| :--- | :--- | :--- |
| **Website & Link Safety** | Passive TLS certificate inspection, HTTP security headers, DNS records, domain age, typo-squatting / lookalike homoglyphs, DOM input forms. | Internal server vulnerabilities, server-side database breaches, zero-day backend exploits. |
| **Operating System** | Browser User-Agent, platform architecture string, display resolution, battery level API (if supported). | **Running OS processes**, task list, system services, CPU/RAM utilization per process, background daemons. |
| **Malware & Antivirus** | Passive URL heuristics, known malicious domain list lookups (with user consent). | **Antivirus installation status**, Windows Defender definition freshness, endpoint detection alerts. |
| **Local Filesystem** | Files explicitly selected and uploaded by the user via `<input type="file">`. | **Local disk contents**, `C:\Windows`, `/etc/`, background file reads, malware scans on desktop files. |
| **Network & Packets** | WebRTC local IP candidates (with permission), public IP of outgoing request. | **Raw packet sniffing**, promiscuous mode, Wi-Fi security keys, local subnet ARP tables. |
| **Other Applications** | Protocol handler registrations (e.g. `mailto:`). | **Installed application catalog**, software versions of desktop apps (e.g., Slack, Zoom, Office). |
| **Browser Environment** | Current tab's DOM, cookies belonging to `trustguard.ai`, localStorage. | Other browser tabs, other websites' cookies, incognito session activities, extension internals. |

---

## 3. Deceptive Cybersecurity Patterns We Reject

1. **Fake Virus Scanning Popups**: Websites that display simulated progress bars pretending to scan `C:\Windows\System32\` and discover "3 viruses found - click here to clean!". These are socially engineered scareware lures.
2. **"100% Safe" Badges**: Security seals that claim a website is completely immune to hacking. Security is a risk continuum, never an absolute state.
3. **Hidden Cloud Sharing**: Uploading your pasted passwords or proprietary code to public LLMs without warning or masking.

---

## 4. When a Native Agent Is Required

To achieve device-level security tasks such as:
- Inspecting active operating system processes for memory injection.
- Real-time file system monitoring against ransomware encryption.
- Firewall packet filtering at the NDIS / kernel driver layer.
- Enforcing enterprise disk encryption (BitLocker / FileVault).

An organization or individual **must install a native endpoint agent** (such as an open-source osquery agent, CrowdStrike Falcon, or Microsoft Defender for Endpoint) or configure Mobile Device Management (MDM).

TrustGuard AI provides a downloadable specification for desktop companion integrations, but will never falsely claim that our browser web application performs native kernel inspection.
