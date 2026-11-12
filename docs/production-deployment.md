# GLR production handoff

## Configured domains

- Frontend: `https://readglr.com`, deployed by the owner to Vercel.
- WordPress backend: `https://marketing.readglr.com/cms`.
- WordPress admin: `https://marketing.readglr.com/cms/wp-admin/`.

The CMS domain connection and HTTPS were verified on 24 October 2026. Both WordPress URL settings use HTTPS, and the existing GLR database `u353810860_BViHU` and administrator password were preserved. The root domain serves the Vercel frontend over HTTPS. Preserve unrelated Hostinger sites and existing DNS records.

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

### Analytics

Vercel Web Analytics is installed in the root layout. Its project setting is enabled in Vercel separately. The Google Analytics stream for `https://readglr.com` is `G-S2R2KWQNS7`, created under `globalluxuryreporter@gmail.com`. This public ID is the frontend default; `NEXT_PUBLIC_GA_MEASUREMENT_ID` can override it at build time. It is not a credential. Deploy the updated source to activate these integrations. Development and Preview do not load the trackers.

Google Analytics loads only after the visitor accepts analytics. Preferences can be reopened from the footer; declining removes accessible first-party Google Analytics cookies and stops the tag. Vercel Analytics is cookie-free. Both integrations remove query strings/fragments from tracked URLs and exclude subscription, API and CMS paths. Google advertising signals are disabled.

Turn off **Enhanced measurement** on the Google web stream: the frontend sends one sanitized `page_view` per route, so automatic history/form/search events must not duplicate those events or include raw query strings. Confirm events on the real domain after deployment in Google Realtime and Vercel Analytics; local tests do not establish live collection.

The canonical public origin is `https://readglr.com`. Set `SITE_URL=https://readglr.com` and `ROBOTS_INDEXING=true` in Vercel **Production**, then redeploy; ignored local environment files do not update Vercel settings. An explicit `false` disables indexing. Preview/development builds and a different configured origin remain noindex.

- `/favicon.ico` contains 16px, 32px and 48px variants derived from the existing GLR logo. `/icon.png` is 96px, `/apple-icon.png` is 180px, and `/manifest.webmanifest` references 192px and 512px icons.
- `/robots.txt` allows public pages and frontend report images. It blocks internal APIs and WordPress-shaped paths. Search and subscription pages retain their existing `noindex` metadata and remain crawlable so crawlers can read that directive.
- `/sitemap.xml` is generated on request with frontend pages, categories and published reports, including report modification dates. It contains no WordPress/admin URLs. Unpublished reports are excluded by the CMS's existing publication filter.
- Public pages have canonical and social metadata. The homepage declares the publication and website; reports declare Article and BreadcrumbList structured data. Reports without an excerpt use their title as a description fallback.

After deployment, check that `https://readglr.com/robots.txt` advertises `https://readglr.com/sitemap.xml`, the sitemap is populated, and a published report returns `index, follow` with a `readglr.com` canonical. Submit that sitemap in the verified `readglr.com` Google Search Console property. Search Console ownership, sitemap submission and actual indexing must be confirmed separately; these code changes do not perform them. WordPress configuration and domain/DNS mapping are unchanged.

## Production checklist — 12 November 2026

- [x] Canonical frontend: `https://readglr.com/` serves the site on Vercel, and HTTP redirects to HTTPS. The Vercel fallback hostname was observed with `noindex, nofollow`.
- [x] Crawl and discovery: live robots.txt advertises sitemap.xml; the sitemap returned 39 canonical frontend URLs, including 24 reports. Homepage and a published report allow indexing and declare canonical URLs. Search declares noindex. RSS and favicon return 200.
- [x] CMS connectivity: the public frontend health check reports WordPress is reachable. Keep the backend on its separate existing hostname.
- [x] Analytics reporting scope: compare Vercel **Page Views**, filtered to Production and `readglr.com`, with GA4 **Views** over the same completed dates. Vercel can measure visits without the GA4 opt-in. GA4 starts after acceptance, can be blocked by browser privacy tools, and has a different reporting cutoff. The totals are not expected to match; keep the opt-in and do not backfill missing views.
- [ ] Deploy the frontend verification tag. In Search Console under `globalluxuryreporter@gmail.com`, verify the **URL-prefix** property `https://readglr.com/` using **HTML tag**. Keep the tag after verification. Submit `sitemap.xml` in Sitemaps, confirm **Success**, then use URL Inspection on the homepage and a published report. Verification and sitemap acceptance do not guarantee indexing.
- [ ] Fix the optional `www.readglr.com` alias. It currently points at Hostinger CDN and fails certificate validation. If the alias should work, add it to the existing Vercel frontend project as a redirect to `readglr.com`, set only the `www` DNS record to Vercel's project-provided target, and verify HTTPS and the redirect. Leave the apex, mail, and `marketing` records intact.
- [ ] After deploying the Google Analytics connection policy update, verify collection in GA4 Realtime with analytics accepted and a browser without tracking blockers. Confirm one `page_view` per public navigation and no GA4 tracking after declining. Compare completed dates once both dashboards have processed them.
- [ ] Run a production subscribe, confirm and unsubscribe cycle with an approved test address. Confirm CMS backups cover the database and private media and test a restore separately.

## Behaviour preserved

The Next.js design, report URLs and browser API endpoints are unchanged. WordPress is the only CMS and owns all editorial data. The WordPress administrator password must remain unchanged.

The new subscription secret invalidates confirmation/unsubscribe links signed with the former development secret. Existing subscriber records and consent metadata are preserved. A reader with an old or expired pending confirmation must request a new confirmation link. New links use the canonical frontend URL.

## Verified before handoff

HTTPS and the authenticated CMS health endpoint passed on the production hostname. All 6 categories and 16 reports remain available; report editorial fields and all 7 published original image checksums match the source export. Anonymous APIs and comments are blocked, the unreferenced asset stays private and imports remain closed. The frontend production build, all four Node tests and PHP contracts passed. Local production-server smoke checks passed for health, homepage, category/report pages and APIs, search, RSS, privacy/terms pages, image proxy/WebP transformation and invalid form rejection. With indexing disabled, the sitemap intentionally contains no public entries.

Gmail SMTP authentication passed. The one owner-approved test message was accepted by Gmail's SMTP server with no rejected recipients; inbox receipt was not independently checked. No live subscription confirmation/welcome messages were sent during the production checks.

Backups must include both the WordPress database and `glr-private-media` outside `public_html`. A restore drill and production load/ingress tests remain unverified. WordPress staff access must be assigned separately if needed.

## Checks after the owner's Vercel deployment

After each production deployment, smoke test `/api/health`, homepage, a category and report, search, images, sitemap and RSS on the real production domain.

The GLR plugin's media toolbar is live, but the expanded audio/video HTML allowlist, document links and byte-range proxy are frontend source changes. Deploy the updated Next.js project before relying on audio/video playback and file downloads on the public site. After deployment, check playback and seeking plus a document download from an owner-approved published report.
