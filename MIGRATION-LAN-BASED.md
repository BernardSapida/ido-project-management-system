# Migration: Running IPMS as a LAN-only (on-premise) system

**Goal:** run the whole system inside the university network — no internet
required. The university hosts the app server *and* the database on their own
machines. Students/staff open IPMS from a browser on the campus LAN.

---

## 1. Is this 100% feasible?

**Short answer: yes.** There is no architectural blocker. Nothing in the app
*requires* a cloud service to function. The core (UI + API + database) runs
offline with only configuration changes.

What makes it feasible:

| Concern | Status |
|---|---|
| App is a **monolith** — one Node process serves the UI and the API together | No separate services to host; "the frontend talks to the server" happens in-process |
| Database is **plain PostgreSQL** via `DATABASE_URL` (Prisma + `@prisma/adapter-pg`) | Point it at an on-prem Postgres and it works — no cloud DB feature used |
| Auth is **Better Auth with DB-backed sessions** (cookies) | No external identity provider; runs fully local |
| **No external CDN, web fonts, analytics, or tracking** in the codebase | Verified — nothing to strip out |
| PDF generation (`@react-pdf/renderer`) runs **server-side with bundled fonts** | No internet at render time |
| **Realtime (Pusher) is not actually wired to the UI** — only a server stub route exists, no `pusher-js` client, comments refresh via normal query refetch | Can be left switched off with zero feature loss |

What needs real work (standard ops, not re-architecture):

| Item | Why | Effort |
|---|---|---|
| **File storage** — currently AWS S3 | Uploads (signatures, request attachments) need an S3-compatible store on the LAN | Deploy **MinIO**, add 2 lines to the S3 client. Low. |
| **Email** — `sendVerificationEmail` / `sendResetPassword` are `console.log` stubs today | New users can't self-verify without a mail path | Wire university SMTP **or** disable email verification (accounts created/approved by admin). Low. |
| **Build / install of `@bernardsapida/web-ui`** (private GitHub Packages) | Needs internet **to install**, not to run | Build on a machine with internet, deploy the artifact. **Or** run a local registry (Verdaccio). Low–medium. |
| **HTTPS on the LAN** | Nice-to-have for cookie security; may be required by university IT policy | Reverse proxy (Caddy/nginx) with an internal/self-signed certificate. Medium. |
| **Deploy target** — currently Netlify build plugin | Need a plain Node server output instead | Switch Nitro to the `node-server` preset. Low. |

**Bottom line:** ~1–2 days of work for a competent dev, most of it MinIO setup
and packaging. No feature has to be dropped. The only "it depends" item is
whether university IT mandates HTTPS internally — that's a proxy + certificate,
still routine.

---

## 2. Target architecture

```
        University LAN (no internet needed)
 ┌───────────────────────────────────────────────────────┐
 │                                                       │
 │   [ Staff / student browser ]                         │
 │            │  https://ipms.univ.local                 │
 │            ▼                                           │
 │   [ Reverse proxy: Caddy/nginx ]  (TLS termination)   │
 │            │                                           │
 │            ▼                                           │
 │   [ IPMS Node server ]  node .output/server/index.mjs │
 │      - serves UI (SSR) + tRPC/REST API                │
 │      - Better Auth (sessions in Postgres)             │
 │            │                     │                     │
 │            ▼                     ▼                     │
 │   [ PostgreSQL ]          [ MinIO (S3-compatible) ]   │
 │    univ DB server          univ storage box          │
 │                                                       │
 │   [ SMTP relay ] (optional — university mail server)  │
 └───────────────────────────────────────────────────────┘
```

Everything above is on campus. Internet is only touched **once**, on a build
machine, to install dependencies.

---

## 3. Migration steps

### Step 0 — Decide the hostname and IP

Pick a stable name and address on the LAN, e.g.:

- Server IP: `10.0.10.20`
- Hostname: `ipms.univ.local` (add to campus DNS, or `/etc/hosts` on clients for a pilot)
- App URL: `https://ipms.univ.local` (or `http://10.0.10.20:4000` if starting without TLS)

This value goes into `VITE_BASE_URL` and is compared by **exact string** in
`src/lib/cors.ts` and Better Auth `trustedOrigins`. No trailing slash. If you
change it later you must **rebuild** (it is inlined at build time).

---

### Step 1 — Provision PostgreSQL on a university server

1. Install PostgreSQL 14+ on the DB machine.
2. Create the database and a user:
   ```sql
   CREATE DATABASE ipms;
   CREATE USER ipms_app WITH PASSWORD '<strong-password>';
   GRANT ALL PRIVILEGES ON DATABASE ipms TO ipms_app;
   ```
3. Allow the app server's IP in `pg_hba.conf` and `listen_addresses` in
   `postgresql.conf`. Keep it restricted to the app server only.
4. Connection string for later:
   ```
   DATABASE_URL=postgresql://ipms_app:<password>@10.0.10.30:5432/ipms
   ```

No schema change is required — Prisma migrations run as-is.

---

### Step 2 — Provision MinIO (replaces AWS S3)

MinIO is a self-hosted, S3-compatible object store. The app's S3 code is
already isolated in **one file** (`src/lib/s3.server.ts`) and already tolerates
S3-compatible providers.

1. Run MinIO on the storage machine (Docker example):
   ```bash
   docker run -d --name minio \
     -p 9000:9000 -p 9001:9001 \
     -e MINIO_ROOT_USER=ipms \
     -e MINIO_ROOT_PASSWORD=<strong-password> \
     -v /srv/minio-data:/data \
     minio/minio server /data --console-address ":9001"
   ```
2. In the MinIO console (`http://<storage-ip>:9001`):
   - Create a bucket, e.g. `ipms-uploads`.
   - Create an access key / secret key pair for the app.
   - Add a **CORS rule** allowing `PUT` and `GET` from the app origin
     (`https://ipms.univ.local`) — the browser uploads directly to MinIO via a
     presigned URL, so its origin must be allowed.
3. The MinIO endpoint (`http://<storage-ip>:9000`) must be reachable **from user
   browsers on the LAN**, not just from the server, because uploads go
   browser → MinIO directly.

#### Code change (small): add an endpoint to the S3 client

In `src/lib/s3.server.ts`, the `S3Client` is built in `s3()`. Add an optional
endpoint + path-style so it can point at MinIO:

```ts
// env.ts — add:
APP_S3_ENDPOINT: z.string().optional(),          // e.g. http://10.0.10.40:9000
APP_S3_FORCE_PATH_STYLE: z.string().default("false"),

// s3.server.ts — in s3():
client = new S3Client({
  credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  region: config.region,                          // any value, e.g. "us-east-1"
  endpoint: env.APP_S3_ENDPOINT || undefined,     // set for MinIO
  forcePathStyle: env.APP_S3_FORCE_PATH_STYLE === "true", // true for MinIO
});
```

Also review `publicUrl()` / `keyFromPublicUrl()` in the same file — they build
`https://<bucket>.s3.<region>.amazonaws.com/...`. For MinIO with path-style the
stored URL should be `<endpoint>/<bucket>/<key>`. Adjust those two helpers to
use `APP_S3_ENDPOINT` when it is set. This is the only non-trivial code edit in
the whole migration, and it is contained to this file.

> Uploaded files are *read back* through `/api/files/*` (the app's own origin
> with the server's credentials), so only the **upload** path is affected by the
> endpoint change.

---

### Step 3 — Email: pick one

The auth callbacks in `src/features/auth/utils/better-auth.ts`
(`sendVerificationEmail`, `sendResetPassword`) currently only `console.log`.

**Option A — Wire university SMTP (recommended if a relay is available).**
Add `nodemailer`, implement the two callbacks to send through the campus mail
server. Set `emailVerification.sendOnSignUp: true` if you want self-service
sign-up to work end to end.

**Option B — No email at all (simplest for a closed system).**
- Keep `sendOnSignUp: false`.
- Add a `databaseHooks.user.create.before` hook that sets `emailVerified: true`
  so new accounts are not bounced to `/verify-email`.
- Password reset becomes an admin action (admin sets a temporary password on
  the accounts page). Document this for the university.

**Option C — Admin-provisioned accounts only.**
Disable public `/sign-up`, have an admin create every account. Combine with the
verified-by-default hook from Option B.

Decide with the university which they want. Option B or C is typical for an
internal tool.

---

### Step 4 — Switch the build to a plain Node server

Today `vite.config.ts` chooses the host adapter at build time: `netlify()`
normally, `nitro({...})` when `process.env.VERCEL` is set. Add a LAN branch.

```ts
// vite.config.ts — replace the single ternary with:
process.env.LAN_BUILD
  ? nitro({ preset: "node-server", traceDeps: ["react", "react-dom"] })
  : process.env.VERCEL
    ? nitro({ traceDeps: ["react", "react-dom"] })
    : netlify(),
```

Build:
```bash
LAN_BUILD=1 pnpm build
```

Output is a standalone server, typically `.output/server/index.mjs`, run with:
```bash
node .output/server/index.mjs      # listens on PORT (default 3000)
```

Keep it alive with **pm2**, **systemd**, or a **Windows Service** (nssm) — see
Step 7.

---

### Step 5 — Handle the private component package (`@bernardsapida/web-ui`)

It installs from GitHub Packages (`npm.pkg.github.com`) and needs a GitHub PAT
with `read:packages`. It is a **build-time** dependency only — the running
server does not contact GitHub.

Pick one:

- **Build off-site (easiest):** run `pnpm install` + `LAN_BUILD=1 pnpm build`
  on a laptop with internet, then copy `.output/` (and `node_modules` if not
  fully bundled) to the university server. The server machine never needs
  internet.
- **Local registry:** run **Verdaccio** on the LAN, publish `@bernardsapida/web-ui`
  into it once, point `.npmrc` at it. Good if the university wants to rebuild
  on-prem repeatedly.
- **Vendor it:** copy the built package into the repo (`patches/` or a local
  workspace package) and drop the GitHub Packages dependency. Highest
  maintenance cost; only if the university forbids any external fetch ever.

---

### Step 6 — Environment file for the university server

Create `.env.local` (or real environment variables) on the server:

```bash
# App origin — EXACT, no trailing slash. Rebuild if this changes.
VITE_BASE_URL=https://ipms.univ.local

# Better Auth
BETTER_AUTH_SECRET=<openssl rand -base64 32>

# Database (Step 1)
DATABASE_URL=postgresql://ipms_app:<password>@10.0.10.30:5432/ipms

# File storage — MinIO (Step 2)
APP_AWS_REGION=us-east-1
APP_AWS_S3_BUCKET=ipms-uploads
APP_AWS_ACCESS_KEY_ID=<minio access key>
APP_AWS_SECRET_ACCESS_KEY=<minio secret key>
APP_S3_ENDPOINT=http://10.0.10.40:9000
APP_S3_FORCE_PATH_STYLE=true

# Realtime — leave blank, feature is inert without it
PUSHER_APP_ID=
PUSHER_APP_SECRET=
VITE_PUSHER_KEY=
VITE_PUSHER_CLUSTER=

# Misc
NODE_ENV=production
APP_VERSION=1.0.0
MINIMUM_APP_VERSION=1.0.0
MAINTENANCE_MODE=false

# Only if there is a mobile client on the LAN — must match the device's origin
# MOBILE_DEV_URL=http://10.0.10.20:4000
```

Run migrations and seed once against the university DB:
```bash
pnpm db:generate
pnpm db:push            # or: pnpm exec prisma migrate deploy
pnpm db:seed            # creates the initial admin — CHANGE ITS PASSWORD
```

---

### Step 7 — Reverse proxy + HTTPS (recommended)

Better Auth marks session cookies `Secure` when `VITE_BASE_URL` is `https://`.
Two paths:

- **Plain HTTP pilot:** set `VITE_BASE_URL=http://10.0.10.20:4000`. Cookies work
  without `Secure`. Fine for a short trial on a trusted LAN; traffic is
  unencrypted.
- **HTTPS (production):** put **Caddy** or **nginx** in front, terminate TLS
  with a certificate from the university's internal CA (or a self-signed cert
  distributed to clients), proxy to the Node server.

Caddy example (`Caddyfile`):
```
ipms.univ.local {
    reverse_proxy 127.0.0.1:3000
    tls internal            # or: tls /path/cert.pem /path/key.pem
}
```

Keep the Node process supervised:

- **Linux:** `systemd` unit running `node /opt/ipms/.output/server/index.mjs`,
  `Restart=always`, `EnvironmentFile=/opt/ipms/.env`.
- **Windows:** `nssm install IPMS "C:\Program Files\nodejs\node.exe" "C:\ipms\.output\server\index.mjs"`.

---

### Step 8 — Verify offline

Disconnect the server from the internet and confirm:

- [ ] `https://ipms.univ.local` loads, SSR works, no console errors about blocked requests
- [ ] Sign in with the seeded admin; session persists across refresh
- [ ] Create a request, add a comment (comment thread refreshes)
- [ ] Upload a signature / attachment → lands in MinIO bucket
- [ ] Open an uploaded file → served via `/api/files/...`
- [ ] Generate a request PDF → renders with fonts
- [ ] Password reset path (per the Step 3 option you chose)
- [ ] Restart the server → it comes back up under the supervisor
- [ ] Pull the network cable → everything above still works

---

## 4. What is explicitly *not* needed

- **Pusher / any realtime service** — no client code uses it. If live updates
  are wanted later, self-host **Soketi** (Pusher-compatible) and fill the
  `PUSHER_*` / `VITE_PUSHER_*` vars; no code change beyond that.
- **Any cloud DB feature** — plain Postgres is enough.
- **CDN / external fonts** — none are referenced.
- **Internet on the app or DB server at runtime** — only the build machine.

## 5. Risks / open questions for the university

1. **HTTPS policy** — will campus IT require TLS internally? If yes, who issues
   the certificate (internal CA vs. self-signed pushed to clients)?
2. **Backups** — nightly `pg_dump` of the IPMS DB and a copy of the MinIO data
   directory. Define retention.
3. **DNS** — can `ipms.univ.local` be added to campus DNS, or do we rely on a
   fixed IP / hosts entries for a pilot?
4. **Rebuild location** — is off-site building acceptable, or must builds happen
   on-prem (→ Verdaccio, Step 5)?
5. **Account provisioning** — self-service sign-up with SMTP, or admin-created
   accounts only (Step 3)?

---

## 6. Effort estimate

| Task | Estimate |
|---|---|
| Postgres + MinIO provisioning | 0.5 day |
| S3 endpoint code change + test | 0.25 day |
| Email decision + implementation | 0.25–0.5 day |
| `node-server` build branch + supervisor setup | 0.25 day |
| Reverse proxy + TLS | 0.5 day |
| Offline verification pass | 0.25 day |
| **Total** | **~1.5–2 days** |
