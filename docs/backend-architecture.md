# GLR backend architecture

The public website is the existing Next.js application. Its pages and same-origin API routes use lib/data-service.js, which calls the private GLR WordPress API through lib/wordpress-client.mjs. Frontend components, layouts and CSS are unchanged.

## Request flows

- Content: Next.js -> authenticated WordPress reports/categories endpoints -> WordPress posts, metadata and taxonomy. Queries expose only published or due scheduled content. Drafts, archived reports and future publication dates are excluded. Due scheduled posts do not depend on visitor-driven WP-Cron.
- Media: browser /api/assets/:id -> authenticated WordPress -> current publication-reference check -> private storage outside public_html. Both layers emit private, no-store. Originals have no public upload URLs. Editors upload images, video, audio and documents from the report toolbar, with nonce-protected previews before publication. Players use byte ranges passed through the frontend proxy; documents download with their filename. File types and contents are checked against an explicit allowlist, with a maximum of 64 MB or the smaller hosting limit.
- Contact: existing validation, honeypot and shared rate limit -> private enquiry record with New / In Progress / Closed workflow.
- Subscribe: existing IP/email limits -> new subscriber defaults to Active -> Next.js sends a welcome email with a signed unsubscribe link. Existing pending registrations and resubscription requests retain their confirmation flow; WordPress locks the row and rechecks nonce and expiry before activation. Existing subscriber statuses are not bulk changed. Unsubscribe links retain stable subscriber IDs and use the configured subscription signing secret. Frontend welcome-message changes require the next Vercel deployment.
- Administration: WordPress Reports, GLR Categories, GLR Media, GLR Enquiries and GLR Subscribers. The GLR Editor role manages content and records without configuration access. Assign staff access through WordPress user roles.

## Security and caching

WORDPRESS_SERVICE_TOKEN is server-only. A separate, uncommitted service-key.php deployment file contains its SHA-256 verifier. Anonymous REST access is blocked and the public WordPress theme is disabled. Comments and pingbacks are closed on all posts, including REST/XML-RPC submission paths.

Content reads use no-store, so edits affect the next request without a webhook. The existing RSS endpoint retains its five-minute public cache policy. Rate limits use short-lived hashed records in the new WordPress database. Production RATE_LIMIT_IP_HEADER must name a header overwritten by the trusted ingress.

## Deployment and recovery

WordPress lives at public_html/cms; original images live at the same site's glr-private-media directory outside public_html. Back up the database, private media and deployed service-key configuration together. Verify private media is covered by hosting backups or arrange an additional backup before launch.

WordPress is the only supported CMS. Local .env.local points at WordPress; the public frontend deployment is managed separately through Vercel.

The production CMS is `https://marketing.readglr.com/cms`. The canonical frontend URL, Gmail SMTP credentials, legal identity and a new subscription signing secret are configured in ignored environment files. Import the production values into Vercel before deploying; see [the production handoff](production-deployment.md). Verify production ingress, the complete subscription email flow and a database/private-media restore. Changing the signing secret invalidates existing subscription links. Keep indexing off until launch checks pass. See wordpress/README.md for deployment identifiers, editor instructions and verification limits.
