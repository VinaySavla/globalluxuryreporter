# Global Luxury Reporter

A single Next.js application containing the responsive editorial frontend, server-rendered data layer, API route handlers, contact validation, and Directus integration. Directus is the only separately hosted service.

## Architecture

- Pages and components: `app/` and `components/`
- Next.js API endpoints: `app/api/`
- Server-only Directus mapping: `lib/data-service.js`
- Local editorial fallback data: `lib/fallback-data.js`
- Local images: `public/`

The Directus token is read only by server code and is never included in the browser bundle. Server-rendered pages call the shared data service directly; browser form submissions use the same-origin `/api/contact` endpoint.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Keep `USE_MOCK_DATA=true` until Directus is available.

## Deploy to Vercel

Import this repository as one Next.js Vercel project. Add these server-side environment variables for Production and Preview:

- `DIRECTUS_URL`
- `DIRECTUS_TOKEN`
- `USE_MOCK_DATA=true` initially, then `false` when Directus is connected

No `NEXT_PUBLIC_API_URL`, Express server, CORS configuration, or second Vercel project is required.

## API routes

- `GET /api/reports?category=slug&featured=true&search=query&page=1&limit=9`
- `GET /api/reports/:slug`
- `GET /api/categories`
- `POST /api/contact`

## Directus collections

- `reports`: `title`, `slug`, `excerpt`, `content`, `category` (M2O), `cover_image`, `author`, `published_at`, `featured`, `status`
- `categories`: `name`, `slug`, `description`, `cover_image`, `sort`
- `inquiries`: `name`, `email`, `phone`, `message`, `status`
