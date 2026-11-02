# ImageKit Pro — Security & Domain Hardening Policy

This document provides technical security documentation, operational guidelines, and DNS hardening records for **`https://imagekitpro.cc`**.

---

## 1. Zero-Trust Client-Side Architecture

ImageKit Pro is architected as an offline-first, client-side web application:
- **Zero Server Uploads:** All transformations (compression, background removal, cropping, watermark removal, OCR, PDF generation) execute exclusively in the user's browser memory (RAM/GPU).
- **Zero Telemetry of User Media:** No image bytes or file metadata are ever transmitted over the network.
- **Ephemeral Processing:** All canvas bitmaps, typed arrays, and object URLs (`blob:`) are held in memory during the tab session and garbage collected when the tab is closed or navigated.

---

## 2. DNS & Domain Hardening Records

Copy and paste these exact DNS records into your domain registrar / DNS provider (Cloudflare, Namecheap, Route 53) for `imagekitpro.cc`.

### A. Anti-Spoofing & Email Protection (Null MX, SPF, DMARC)
Because `imagekitpro.cc` sends no outgoing transactional or marketing emails, advertise that no server is authorized to send mail on behalf of the domain and no server receives mail.

| Type | Name | Content / Value | Priority | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MX** | `@` | `.` | `0` | Auto | **Null MX (RFC 7505):** Explicitly tells mail transfer agents that this domain accepts no inbound mail. |
| **TXT** | `@` | `v=spf1 -all` | - | Auto | **Strict SPF:** Declares that zero IP addresses or servers are authorized to send email from `@imagekitpro.cc`. |
| **TXT** | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` | - | Auto | **DMARC Strict Reject:** Commands receiving servers to reject any spoofed emails purporting to be from this domain. |

### B. Certification Authority Authorization (CAA)
Restrict certificate issuance to trusted Certificate Authorities (CAs) to prevent unauthorized rogue certificate issuance.

| Type | Name | Tag | Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **CAA** | `@` | `issue` | `"letsencrypt.org"` | Authorizes Let's Encrypt for TLS certificates |
| **CAA** | `@` | `issue` | `"digicert.com"` | Authorizes DigiCert / Cloudflare Universal SSL |
| **CAA** | `@` | `issue` | `"pki.goog"` | Authorizes Google Trust Services |
| **CAA** | `@` | `iodef` | `"mailto:security@imagekitpro.cc"` | Security violation reporting endpoint |

### C. DNSSEC (DNS Security Extensions)
1. In Cloudflare Dashboard, navigate to **DNS** > **Settings** > **DNSSEC**.
2. Click **Enable DNSSEC**.
3. Copy the generated **DS Record** (Key Tag, Algorithm, Digest Type, Digest).
4. Paste the DS Record into your domain registrar's DNSSEC management interface.
5. Verification: run `dig +dnssec imagekitpro.cc` and confirm the `ad` (authenticated data) flag is present.

### D. Cloudflare Edge Security Configuration
When proxying `imagekitpro.cc` through Cloudflare:
- **SSL/TLS Encryption Mode:** Set to **Full (Strict)**.
- **Always Use HTTPS:** Enabled (redirects HTTP requests to HTTPS with status code 301).
- **HSTS (HTTP Strict Transport Security):**
  - Status: Enabled
  - Max-Age: 12 months (31,536,000s) or 24 months (63,072,000s)
  - Include subdomains: Enabled
  - Preload: Enabled (eligible for submit to `hstspreload.org`)
- **Minimum TLS Version:** TLS 1.2 (TLS 1.3 enabled with 0-RTT).
- **Automatic HTTPS Rewrites:** Enabled.
- **Web Application Firewall (WAF):**
  - Enable Managed Ruleset (Cloudflare Managed Rules).
  - Rate Limiting: Limit requests to static assets to protect against denial-of-service floods.

---

## 3. HTTP Security Headers

ImageKit Pro configures comprehensive defensive headers in `vercel.json`:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://imagekitpro.cc; font-src 'self' data:; connect-src 'self' blob: data: https://imagekitpro.cc https://cloudflareinsights.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
```

### Justification for Policy Directives:
- **`wasm-unsafe-eval` & `unsafe-eval`:** Required for dynamic WebAssembly binary compilation inside Web Workers by **ONNX Runtime Web** (AI background remover) and **Tesseract.js** (OCR engine).
- **`blob:` in script/worker-src:** Required because Web Workers and object URLs are generated dynamically in browser memory without hitting disk.
- **`frame-ancestors 'none'` / `X-Frame-Options: DENY`:** Protects against clickjacking attacks.
- **`Permissions-Policy`:** Explicitly revokes browser permission for camera, microphone, geolocation, and payment APIs.

---

## 4. Supply Chain & Code Hygiene

- **All Assets Self-Hosted:** No fonts, scripts, or runtime WASM files are fetched from third-party CDNs. Fonts are bundled via `@fontsource`.
- **Automated Dependabot:** Dependency security updates run weekly via `.github/dependabot.yml`.
- **GitHub Actions Security:** Automated npm vulnerability scanning and GitHub CodeQL static analysis run on every push to `main` via `.github/workflows/security.yml`.
- **Sanitized Intake:**
  - `MAX_FILE_SIZE = 50 MB` prevents memory starvation.
  - `MAX_IMAGE_PIXELS = 100 MP` protects against decompression bombs.
  - `DOMPurify.sanitize()` scrubs malicious `<script>`, `foreignObject`, and event handlers from SVG inputs.
  - `sanitizeFilename()` strips path traversal (`../`) and null bytes from download headers.

---

## 5. Vulnerability Disclosure Policy

Security researchers who discover potential vulnerabilities may report them according to RFC 9116:
- **Security Contact:** `mailto:security@imagekitpro.cc`
- **Security TXT:** [`https://imagekitpro.cc/.well-known/security.txt`](file:///c:/Users/ak500/OneDrive/Desktop/IT/saas-image/public/.well-known/security.txt)
- **Response SLA:** We acknowledge vulnerability reports within 48 hours and coordinate prompt remediation.
