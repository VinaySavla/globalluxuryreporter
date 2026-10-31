# GLR production handoff

## Configured domains

- Frontend: `https://readglr.com`, deployed by the owner to Vercel.
- WordPress backend: `https://marketing.readglr.com/cms`.
- WordPress admin: `https://marketing.readglr.com/cms/wp-admin/`.

The CMS domain connection and HTTPS were verified on 24 October 2026. Both WordPress URL settings use HTTPS, and the existing GLR database `u353810860_BViHU` and administrator password were preserved. The root domain belongs to the Vercel frontend; its final connection remains part of the owner's deployment. Preserve unrelated Hostinger sites and existing DNS records.

The former GLR CMS was retired on 24 October 2026: its dedicated container/network and scheduled backup job were removed from active service, its configuration/files were moved into a private recovery backup, and its old database was deleted after confirmation. The former hostname returns HTTP 410. WordPress is the only active GLR backend. Verified recovery copies are kept outside this repository; unrelated server applications and Hostinger resources were preserved.

## Environment configuration

The ignored `.env.vercel.local` file contains the production environment values, including the private WordPress service token, a new cryptographically random subscription secret and Gmail SMTP credentials. Import its values into the Vercel project's **Production** environment before deploying. A Git push does not upload ignored environment files. Do not commit this file or paste its secrets into public logs.

- `WORDPRESS_URL`: `https://marketing.readglr.com/cms`
- `WORDPRESS_SERVICE_TOKEN`: existing private GLR CMS token; unchanged by the domain move.
- `SITE_URL`: `https://readglr.com`
- `SUBSCRIPTION_SECRET`: newly generated 64-byte secret, stored only in ignored/private files.
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `465`
- `SMTP_SECURE`: `true`
- `SMTP_USER`: `globalluxuryreporter@gmail.com`
- `SMTP_PASSWORD`: supplied Gmail app password, stored only in ignored/private files.
- `EMAIL_FROM`: `Global Luxury Reporter <globalluxuryreporter@gmail.com>`
- `RATE_LIMIT_IP_HEADER`: `x-vercel-forwarded-for`. Vercel supplies this client-IP header: https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
- `LEGAL_ENTITY_NAME`: `Global Luxury Reporter`; `LEGAL_ADDRESS`: `Mumbai`; `PRIVACY_EMAIL`: `info@readglr.com`, as supplied by the owner.
- `ROBOTS_INDEXING`: `true` for the canonical production deployment; `false` for previews. Preview and development builds are additionally protected by the deployment-environment check, even when the flag is accidentally enabled.

Use separate preview settings so previews are not indexed and do not silently replace production URLs. Never prefix credentials with `NEXT_PUBLIC_`.

## Frontend SEO and indexing

The canonical public origin is `https://readglr.com`. Set `SITE_URL=https://readglr.com` and `ROBOTS_INDEXING=true` in Vercel **Production**, then redeploy; ignored local environment files do not update Vercel settings. An explicit `false` disables indexing. Preview/development builds and a different configured origin remain noindex.

- `/favicon.ico` contains 16px, 32px and 48px variants derived from the existing GLR logo. `/icon.png` is 96px, `/apple-icon.png` is 180px, and `/manifest.webmanifest` references 192px and 512px icons.
- `/robots.txt` allows public pages and frontend report images. It blocks internal APIs and WordPress-shaped paths. Search and subscription pages retain their existing `noindex` metadata and remain crawlable so crawlers can read that directive.
- `/sitemap.xml` is generated on request with frontend pages, categories and published reports, including report modification dates. It contains no WordPress/admin URLs. Unpublished reports are excluded by the CMS's existing publication filter.
- Public pages have canonical and social metadata. The homepage declares the publication and website; reports declare Article and BreadcrumbList structured data. Reports without an excerpt use their title as a description fallback.

After deployment, check that `https://readglr.com/robots.txt` advertises `https://readglr.com/sitemap.xml`, the sitemap is populated, and a published report returns `index, follow` with a `readglr.com` canonical. Submit that sitemap in the verified `readglr.com` Google Search Console property. Search Console ownership, sitemap submission and actual indexing must be confirmed separately; these code changes do not perform them. WordPress configuration and domain/DNS mapping are unchanged.

## Behaviour preserved

The Next.js design, report URLs and browser API endpoints are unchanged. WordPress is the only CMS and owns all editorial data. The WordPress administrator password must remain unchanged.

The new subscription secret invalidates confirmation/unsubscribe links signed with the former development secret. Existing subscriber records and consent metadata are preserved. A reader with an old or expired pending confirmation must request a new confirmation link. New links use the canonical frontend URL.

## Verified before handoff

HTTPS and the authenticated CMS health endpoint passed on the production hostname. All 6 categories and 16 reports remain available; report editorial fields and all 7 published original image checksums match the source export. Anonymous APIs and comments are blocked, the unreferenced asset stays private and imports remain closed. The frontend production build, all four Node tests and PHP contracts passed. Local production-server smoke checks passed for health, homepage, category/report pages and APIs, search, RSS, privacy/terms pages, image proxy/WebP transformation and invalid form rejection. With indexing disabled, the sitemap intentionally contains no public entries.

Gmail SMTP authentication passed. The one owner-approved test message was accepted by Gmail's SMTP server with no rejected recipients; inbox receipt was not independently checked. No live subscription confirmation/welcome messages were sent during the production checks.

Backups must include both the WordPress database and `glr-private-media` outside `public_html`. A restore drill and production load/ingress tests remain unverified. WordPress staff access must be assigned separately if needed.

## Checks after the owner's Vercel deployment

Connect `readglr.com` to the intended Vercel project using the exact DNS values supplied by that project, while retaining the separate `marketing` backend record. Verify `/api/health`, homepage, category pages, reports, search, images, sitemap, RSS and a complete subscribe/confirm/unsubscribe cycle on the real production domain. The local checks cannot establish that a future Vercel deployment has the correct environment or DNS.

The GLR plugin's media toolbar is live, but the expanded audio/video HTML allowlist, document links and byte-range proxy are frontend source changes. Deploy the updated Next.js project before relying on audio/video playback and file downloads on the public site. After deployment, check playback and seeking plus a document download from an owner-approved published report.
