# WebAIAutomation

AI tools directory, automation resources, guides, blog and free browser-based utilities. Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Framer Motion and Lucide.

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
npm run email:test # send one real test email through Resend (optionally: -- you@example.com)
```

## Where things live

- `src/data/` — all content (tools, categories, articles, guides, utilities, navigation, site config, legal pages, admin sample data). Replace these with database/API calls later; pages only use the helpers.
- `src/app/(site)/` — public pages; `src/app/admin/` — password-protected dashboard (`noindex`). **Leads** is backed by MongoDB; the other admin sections are still a demo with in-memory state.
- `src/data/services.ts` — services, pricing packages, process, use cases and FAQs shown on `/services`.
- `src/lib/actions/` — Server Actions: inquiry form, admin login/logout, lead status and notes.
- `src/lib/server/` — server-only code: MongoDB connection (`mongodb.ts`), leads data access, rate limiting, email (Resend), lead notifications.
- `src/proxy.ts` + `src/lib/auth/` — admin session cookie and the `/admin` gate.
- `db/schema.mjs` — MongoDB collections, validators and indexes (`leads`, `lead_notes`, `rate_limits`).
- `scripts/mongo-backup.sh`, `scripts/mongo-restore.sh` — backup/restore with mongodump/mongorestore.
- `deploy/` — nginx and systemd templates; `docs/ORACLE-CLOUD-DEPLOYMENT.md` — full server setup guide.
- `tests/` — Vitest tests for the database layer, rate limiting, admin auth and the inquiry form.
- `src/lib/seo.ts`, `src/lib/schema.ts` — metadata and JSON-LD builders. Canonical domain is set in `src/data/site.ts`.
- `src/lib/text-tools.ts` — the logic behind the free utilities (runs in the browser).

## Before launch

- Fill in the `[bracketed]` placeholders in `src/data/legal.ts` and have the legal pages reviewed.
- Confirm the contact email and social URLs in `src/data/site.ts`.
- Connect real backends for the contact, newsletter and tool-submission forms (still demo mode).
- Review the service descriptions and package contents in `src/data/services.ts` so they match what you will deliver.

## Lead capture, admin and affiliate setup

The service quote form (`/services`) and sponsor form (`/advertise`) save inquiries to MongoDB and email a notification. See `.env.example` for every variable.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for a user with `readWrite` on the app database. |
| `MONGODB_DB_NAME` | No | Database name (default `webaiautomation`). |
| `AUTH_SECRET` | Yes | 32+ random characters (`openssl rand -base64 48`). Signs admin sessions, keys IP hashes. |
| `ADMIN_PASSWORD` | Yes | 12+ characters. Password for `/admin`. Changing it signs out all sessions. |
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

**Analytics:** no provider is installed. `src/lib/analytics.ts` forwards `services_page_view`, `consultation_click`, `inquiry_submit`, `whatsapp_click` and `affiliate_click` to GA4 (`gtag`), Google Tag Manager (`dataLayer`) or Plausible once one of them is added to the root layout, and does nothing otherwise. Update the privacy policy before adding one.
