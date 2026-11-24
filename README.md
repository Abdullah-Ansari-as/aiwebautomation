# WebAIAutomation

AI automation agency website + business dashboard: an AI tools directory, guides, blog and free utilities that attract visitors, plus monthly service plans, lead capture, a client & invoicing system with MRR tracking, team logins and built-in analytics. Built with Next.js 16 (App Router, Cache Components), TypeScript, MongoDB, Tailwind CSS v4, Framer Motion and Lucide.

## Quick start (local)

```bash
npm install
npm run db:local     # terminal 1: local MongoDB in ./.data/mongo (or use MongoDB Atlas)
npm run db:setup     # once: collections, validators, indexes
npm run dev          # terminal 2: http://localhost:3000
```

Copy `.env.example` to `.env.local` first and fill in at least `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Then sign in at **http://localhost:3000/admin/login** with `ADMIN_EMAIL` + `ADMIN_PASSWORD`; that account is the **super admin**.

## Scripts

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:3000
npm run build      # production build (prerenders all pages)
npm start          # serve the production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run covers     # generate cover images for new articles/guides (add --force to regenerate)
npm test           # Vitest suite against a throwaway MongoDB (see "Tests")
npm run db:setup   # create MongoDB collections, validators and indexes (safe to re-run)
npm run db:local   # local MongoDB for development (data in ./.data/mongo)
npm run email:test # send one real test email through Resend (optionally: -- you@example.com)
```

## Where things live

- `src/data/` — all content (tools, categories, articles, guides, utilities, navigation, site config, legal pages, admin sample data). Replace these with database/API calls later; pages only use the helpers.
- `src/app/(site)/` — public pages; `src/app/admin/` — the business dashboard (`noindex`, login required); `src/app/invoice/[token]` — the client-facing invoice page.
- `src/data/services.ts` — services, pricing packages, process, use cases and FAQs shown on `/services`.
- `src/lib/actions/` — Server Actions: public forms (quote, contact, newsletter, tool submission), admin login, team, leads, clients/invoices/settings, inbox.
- `src/lib/server/` — server-only data access (one module per collection: leads, clients, invoices, messages, subscribers, submissions, settings, analytics, admin users), rate limiting, email (Resend), notifications, CSV export.
- `src/proxy.ts` + `src/lib/auth/` — signed session cookie, roles (super admin / admin / viewer), scrypt password hashing, the `/admin` gate.
- `db/schema.mjs` — every MongoDB collection with its validator and indexes.
- `scripts/mongo-backup.sh`, `scripts/mongo-restore.sh` — backup/restore with mongodump/mongorestore.
- `deploy/` — nginx and systemd templates; `docs/ORACLE-CLOUD-DEPLOYMENT.md` — full server setup guide.
- `tests/` — Vitest tests for the database layer, rate limiting, admin auth and the inquiry form.
- `src/lib/seo.ts`, `src/lib/schema.ts` — metadata and JSON-LD builders. Canonical domain is set in `src/data/site.ts`.
- `src/lib/text-tools.ts` — the logic behind the free utilities (runs in the browser).

## Business dashboard (`/admin`)

| Section | What it does |
| --- | --- |
| **Overview** | MRR (monthly recurring revenue), collected this month, outstanding & overdue invoices, new leads, pipeline, visitors, revenue chart, activity log, setup checklist. |
| **Leads** | Quote and sponsor requests. Status pipeline, internal notes, CSV export, **Convert to client** (marks the lead Won). |
| **Clients** | Paying clients with plan, currency (USD/GBP/AUD/EUR/CAD), monthly fee, setup fee, billing day, status. Active clients' fees = MRR. |
| **Invoices** | Line-item invoices, numbered `INV-2026-0001`. **Generate monthly invoices** creates one draft per active client per month (setup fee on the first; safe to repeat). Email to client (Resend) or copy the secure link; record payments (Payoneer, Wise, bank, Upwork…); void; overdue tracking. |
| **Client invoice page** | `/invoice/<token>` — unguessable link; client views, clicks **Pay now** (your Payoneer/Wise link) and saves as PDF. Drafts are never visible. |
| **Messages / Tool submissions / Subscribers** | Contact-form inbox, editorial review queue, newsletter list with CSV export and data deletion. |
| **Content / Analytics** | Everything published with 30-day views; built-in cookieless analytics (views, unique visitors, top pages, referrers, conversions). |
| **Team / Settings / My account** | Super admin adds **admin** (full business access) or **viewer** (read-only) logins; business & payment details printed on invoices; system status; password change. |

**Roles.** The super admin is `ADMIN_EMAIL` + `ADMIN_PASSWORD` from the environment and works even when the database is down. Team members live in `admin_users` with scrypt-hashed passwords; deactivating, resetting a password or changing a role signs that person out immediately. Every data read and action re-checks the session and role on the server.

## Before launch

- Fill in the `[bracketed]` placeholders in `src/data/legal.ts` and have the legal pages reviewed.
- Confirm the contact email and social URLs in `src/data/site.ts`.
- In **/admin/settings** add your business address, payment instructions and your Payoneer/Wise payment link (shown on every invoice).
- Review the monthly plans (`monthlyPlans`) and one-time packages in `src/data/services.ts` so they match exactly what you will deliver.
- Set `RESEND_API_KEY` + `EMAIL_FROM` (verified domain) so leads/messages are emailed to you and invoices can be emailed to clients.

## Lead capture, admin and affiliate setup

All public forms (quote, sponsor, contact, newsletter, tool submission) save to MongoDB, are rate-limited and bot-filtered, and email a notification when Resend is configured. See `.env.example` for every variable.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for a user with `readWrite` on the app database. |
| `MONGODB_DB_NAME` | No | Database name (default `webaiautomation`). |
| `AUTH_SECRET` | Yes | 32+ random characters (`openssl rand -base64 48`). Signs admin sessions, keys IP hashes. |
| `ADMIN_EMAIL` | Recommended | Super admin login email (defaults to the site email). |
| `ADMIN_PASSWORD` | Yes | 12+ characters. Super admin password. Changing it signs out all sessions. |
| `ADMIN_NAME` | No | Super admin display name. |
| `APP_URL` | No | Base URL for links in emails and invoice links (default: canonical domain). |
| `NEXT_PUBLIC_BOOKING_URL` | No | Calendly/Cal.com link; shows "Book a free call" on `/services` (build time). |
| `RESEND_API_KEY`, `EMAIL_FROM` | Recommended | Email notifications via [Resend](https://resend.com). `EMAIL_FROM` must use a domain verified in Resend. |
| `LEADS_NOTIFY_EMAIL` | No | Notification recipient (defaults to the site email). |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | Digits only, with country code. Read at **build** time; WhatsApp buttons are hidden while empty. |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Multi-instance self-hosting only | Keeps Server Action IDs valid across instances. |

Without the database, the forms show a "temporarily unavailable — email us" message. Without `AUTH_SECRET`/`ADMIN_PASSWORD`, `/admin` stays locked. Without Resend, leads are still saved and the lead page shows "email not configured".

**Deploy:** follow [docs/ORACLE-CLOUD-DEPLOYMENT.md](docs/ORACLE-CLOUD-DEPLOYMENT.md) (Oracle Cloud Ampere A1, Ubuntu 24.04, MongoDB 8, nginx, systemd, Certbot, backups). In short: install MongoDB with authentication → create the app user → set the variables in `.env.production.local` → `npm ci && npm run db:setup && npm run build` → start with systemd behind nginx → test a real inquiry and `/admin`.

**Rate limiting** keys on the client IP from `X-Real-IP` (falling back to `X-Forwarded-For`). The bundled nginx config overwrites both with the real peer address; keep that if you change the proxy, or visitors could spoof their IP. Counters live in MongoDB. If MongoDB is unreachable, the same limits are enforced from the app process's memory (logged once per outage); that fallback is per process, resets on restart and is not shared between multiple app instances. Other unexpected rate-limiter errors make admin sign-in refuse attempts rather than allow them.

## Tests

```bash
npm test
```

Runs Vitest against an isolated MongoDB: by default a throwaway `mongod` started by `mongodb-memory-server-core` (it downloads the MongoDB binary on first run, ~100 MB, cached in `~/.cache/mongodb-binaries`). To use your own server instead, set `MONGODB_TEST_URI=mongodb://127.0.0.1:27017`. Every test file creates and drops its own `waa_test_*` database. `MONGODB_URI` is ignored, so tests never touch real data. On Ubuntu derivatives (Pop!_OS, Mint…) the binary download may need a hint: `MONGOMS_DISTRO=ubuntu-24.04 npm test`.

**Affiliate links:** add an `affiliate` object to a tool in `src/data/tools.ts` only after joining that vendor's program:

```ts
affiliate: {
  url: "https://…",            // tracking URL issued by the program
  status: "active",            // "pending" / "paused" keep the button hidden
  program: "PartnerStack",     // optional, for your reference
  ctaLabel: "Try Zapier free", // optional
  trackingParams: { utm_source: "webaiautomation" }, // optional
},
```

The tool page then shows the affiliate button with a disclosure and `rel="sponsored"`; otherwise it links to the official site as before.

**Analytics:** built in and cookieless. Page views and conversion events (`services_page_view`, `consultation_click`, `inquiry_submit`, `whatsapp_click`, `affiliate_click`, `newsletter_signup`, `booking_click`) are sent to `POST /api/track` and stored as daily totals in MongoDB (`analytics_daily`); unique visitors use a daily-rotating hash that is deleted after 2 days. Bots and `/admin` are ignored. Events are also forwarded to GA4/GTM/Plausible if you add one later (update the privacy policy first).
