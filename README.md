# Global Luxury Reporter

A Next.js application containing the responsive editorial frontend and its server-side backend-for-frontend (BFF). WordPress is the private editorial backend, using the project-specific `wordpress/glr-cms` plugin. Browser code receives neither the WordPress service token nor direct CMS image URLs. The frontend design remains in Next.js.

## Architecture

- Pages and components: `app/` and `components/`
- Next.js API endpoints: `app/api/`
- Server-only WordPress mapping: `lib/data-service.js` and `lib/wordpress-client.mjs`
- Local images: `public/`
- WordPress plugin, packaging script, verification and editor guide: `wordpress/`

The WordPress token is read only by server code and is never included in the browser bundle. Server-rendered pages call the shared data service directly; browser form submissions and authorized CMS assets use same-origin Next.js endpoints. Content reads use `no-store`, so published WordPress changes are visible on the next request without a cache-invalidation webhook.

## Local development

Use Node.js 22.12 or newer. The sanitizer requires this minimum; CI uses Node 22.

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Development and production both use WordPress. CMS operation details are in [`wordpress/README.md`](wordpress/README.md).
The `postcss-selector-parser` override keeps the typography plugin on the patched 6.x parser without downgrading its styles. Keep the audit step enabled when updating the lockfile.
The full request flow, security model, and deployment checklist are documented in [`docs/backend-architecture.md`](docs/backend-architecture.md).

## Deploy to Vercel

The production WordPress backend is `https://marketing.readglr.com/cms`. Follow [`docs/production-deployment.md`](docs/production-deployment.md) to import the prepared private environment values and complete the frontend deployment.

Import this repository as one Next.js Vercel project. Add these server-side environment variables for Production and Preview:

- `WORDPRESS_URL` (including `/cms`)
- `WORDPRESS_SERVICE_TOKEN`
- `SITE_URL`
- `SUBSCRIPTION_SECRET`
- `RATE_LIMIT_IP_HEADER` set to a header overwritten by the trusted ingress
- SMTP and sender variables from `.env.example`
- `ROBOTS_INDEXING=true` on the canonical Production deployment; `false` on Preview

No `NEXT_PUBLIC_API_URL`, Express/Fastify server, CORS configuration, or second Next.js project is required. The GLR WordPress API requires server authentication; WordPress admin requires its own login.

Production SEO settings, favicon routes and indexing verification are listed in [`docs/production-deployment.md`](docs/production-deployment.md). Sitemap entries and canonical URLs point only to the frontend at `https://readglr.com`.

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

## Editorial data

- Reports are WordPress `glr_report` posts with the existing report fields in post metadata.
- Categories are `glr_category` terms with cover image, source ID and sort metadata.
- Enquiries, subscribers and media metadata live in the installation's `glr_records` table; rate limits use its `glr_attempts` table. WordPress adds its own table prefix.
- Original media files are stored outside `public_html`, in the site's `glr-private-media` directory.
- Blog comments and pingbacks are disabled at the server, including REST and XML-RPC entry points.
