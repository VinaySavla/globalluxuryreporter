# GLR backend architecture

## Request path

```text
Public browser
  -> Next.js pages and same-origin /api routes
      -> server-only Directus client (static service token)
          -> private Directus REST API
              -> private MariaDB/MySQL

Editor
  -> TLS identity-aware admin gateway or VPN
      -> Directus Studio
```

Only Next.js and Directus are deployed. Next.js is the single mediator and is the only application that receives the website service token. Directus is reachable from Next.js over a private or tightly restricted network path; its container port is not published directly. Studio access uses a separate admin-only hostname protected before the Directus login screen.

## Security boundaries

- `DIRECTUS_TOKEN` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- The bootstrap creates a non-admin service user and policy limited to the required collections and CRUD actions. Directus Core does not enable custom item/field permission rules, so Next applies the narrower published-item and accepted-field contract before returning data or writing forms.
- Directus public-role access remains disabled. Even images are authorized and streamed through `/api/assets/:id`.
- Subscription activation and opt-out changes require signed, purpose-bound links. Activation happens only after the opt-out email is delivered; anonymous registration never directly reverses an opt-out.
- Contact and subscription limits are shared through short-lived, hashed Directus records. The production ingress must overwrite the configured client-IP header; form routes fail closed when that header name is not configured.
- Draft, archived, and future-scheduled reports are blocked by mandatory Next queries. The Directus token remains private to the server, and no Directus public-role permissions are enabled.
- Admin credentials and the bootstrap admin token belong only in `directus/.env` or a deployment secret manager.
- Use TLS for both public services and for the database connection whenever the database is outside the private deployment network.

## Synchronization behavior

Next content reads use `cache: no-store`. Publishing, unpublishing, rescheduling, or editing a report in Directus therefore affects the next website request without a webhook or stale cache window. CMS images bypass Next Image optimization and the asset proxy emits `private, no-store`, so every request repeats the publication check. Local brand images still use normal Next.js optimization.

The schema bootstrap is safe to rerun. It creates missing GLR objects, refreshes Studio metadata and service permissions, and refuses incompatible field types. It intentionally does not delete unknown fields or content.

## Deployment checklist

1. Use a dedicated MariaDB database and user. Grant the schema-alter privileges Directus needs for bootstrap and migrations.
2. Back up MariaDB and `directus/uploads` together.
3. Fill `directus/.env`, start Directus, and run the configure job.
4. Optionally run the seed job to migrate the current local fixtures and images.
5. Configure every variable in the root `.env.example`; leave `ROBOTS_INDEXING=false` through staging and smoke testing.
6. Configure SPF, DKIM and DMARC for the `EMAIL_FROM` domain and verify confirmation, welcome and unsubscribe delivery.
7. Verify `/api/health`, the home page, category pagination, report rendering, sitemap, robots, search, contact, subscription, and image authorization.
8. Run `npm test` and `npm run build`, test a database/upload restore, and confirm monitoring alerts.
9. Set `ROBOTS_INDEXING=true` only on the canonical production deployment.
10. Remove initial admin credentials from the long-running container environment after first bootstrap if the deployment platform permits it. Keep the bootstrap token only where schema management requires it.
