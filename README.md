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

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Development and production both use WordPress. CMS operation details are in [`wordpress/README.md`](wordpress/README.md).
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
- `ROBOTS_INDEXING=false` until the production smoke test passes

No `NEXT_PUBLIC_API_URL`, Express/Fastify server, CORS configuration, or second Next.js project is required. The GLR WordPress API requires server authentication; WordPress admin requires its own login.

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
- Enquiries, subscribers and image metadata live in the new installation's `glr_records` table; rate limits use its `glr_attempts` table. WordPress adds its own table prefix.
- Original images are stored outside `public_html`, in the new site's `glr-private-media` directory.
- Blog comments and pingbacks are disabled at the server, including REST and XML-RPC entry points.
