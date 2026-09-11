# Global Luxury Reporter

A Next.js application containing the responsive editorial frontend and its server-side backend-for-frontend (BFF). The BFF mediates all website access to a private Directus CMS backed by MariaDB/MySQL. Directus is the admin interface and content system; browser code never receives its URL or service token.

## Architecture

- Pages and components: `app/` and `components/`
- Next.js API endpoints: `app/api/`
- Server-only Directus mapping: `lib/data-service.js`
- Local editorial fallback data: `lib/fallback-data.js`
- Local images: `public/`
- Directus container, schema bootstrap, service policy, and optional starter import: `directus/`

The Directus token is read only by server code and is never included in the browser bundle. Server-rendered pages call the shared data service directly; browser form submissions and authorized CMS assets use same-origin Next.js endpoints. Content reads use `no-store`, so published Directus changes are visible on the next request without a cache-invalidation webhook.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Mock data is development-only and is ignored in production. For the complete CMS setup, follow [`directus/README.md`](directus/README.md).
The full request flow, security model, and deployment checklist are documented in [`docs/backend-architecture.md`](docs/backend-architecture.md).

## Deploy to Vercel

Import this repository as one Next.js Vercel project. Add these server-side environment variables for Production and Preview:

- `DIRECTUS_URL`
- `DIRECTUS_TOKEN`
- `USE_MOCK_DATA=false`
- `SITE_URL`
- `SUBSCRIPTION_SECRET`
- `RATE_LIMIT_IP_HEADER` set to a header overwritten by the trusted ingress
- SMTP and sender variables from `.env.example`
- `ROBOTS_INDEXING=false` until the production smoke test passes

No `NEXT_PUBLIC_API_URL`, Express/Fastify server, CORS configuration, or second Next.js project is required. Directus must remain private; protect remote Studio access with a TLS identity-aware gateway or VPN.

## API routes

- `GET /api/reports?category=slug&featured=true&search=query&page=1&limit=9`
- `GET /api/reports/:slug`
- `GET /api/categories`
- `POST /api/contact`
- `POST /api/subscribe`
- `POST /api/subscription/confirm`
- `POST /api/subscription/unsubscribe`
- `GET /api/assets/:id`
- `GET /api/health`

## Directus collections

- `reports`: `title`, `slug`, `excerpt`, `content`, `category` (M2O), `cover_image`, `cover_alt`, `author`, `published_at`, `reading_time`, `featured`, `editor_pick`, `popularity`, `status`
- `categories`: `name`, `slug`, `description`, `cover_image`, `sort`
- `inquiries`: `name`, `email`, `message`, `status`
- `subscribers`: double-opt-in state, consent audit fields, and confirmation metadata
- `request_attempts`: short-lived hashed abuse-control counters
