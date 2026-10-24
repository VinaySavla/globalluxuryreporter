# GLR WordPress CMS

WordPress is the project's only editorial backend.

- Admin: https://marketing.readglr.com/cms/wp-admin/
- Installation: `31244978`, in `/cms`.
- Database: `u353810860_BViHU`.
- Plugin source: `glr-cms/glr-cms.php`.
- Server credentials stay in ignored environment files and the deployed `service-key.php`.

## Editor guide

1. Open WordPress through Hostinger hPanel's WordPress Admin control for `marketing.readglr.com`. A normal WordPress login is also available at the admin URL above. The administrator password was preserved. No passwords are included in this repository.
2. Use **Reports** to create or edit articles. Enter the title, body, excerpt, category, byline, image description, reading time and optional Featured / Editor's Pick / popularity score. Upload a cover image in Editorial details. Incomplete published reports are saved as drafts.
3. Use the standard publication date control to schedule an article. Use Draft, Published or Archived to manage visibility. Avoid manually changing published slugs without arranging redirects.
4. Use **GLR Categories** for names, descriptions and ordering. Upload category covers in **GLR Media**, then paste the image ID into the category's Cover image ID field.
5. Use **GLR Media** to upload and preview images. For inline article images, insert the displayed `/api/assets/<id>` URL into the article editor. The frontend supplies article typography; no WordPress page builder is needed.
6. **GLR Enquiries** manages enquiry status. **GLR Subscribers** displays subscriber state and consent metadata and supports status changes. Administrators can assign the GLR Editor role to editorial staff.
7. Comments are disabled server-side, regardless of editor settings. There is no public comment UI in the Next.js site.

## Plugin packaging

The packaging helper copies the plugin and writes its service-token verifier into a private directory outside this repository. Reuse the existing credentials file to preserve frontend access:

```powershell
node wordpress/scripts/stage-plugin.mjs C:/path/to/private-staging
```

Packaging does not deploy anything. The local plugin source no longer contains the retired one-time import/audit routes. The live plugin was not changed during repository cleanup. Stable imported content IDs remain supported so existing records and URLs keep working.

## Verification and recovery

Run `npm test`, `npm run build`, `php -l wordpress/glr-cms/glr-cms.php` and `php wordpress/tests/contracts.php`. Publication, authentication, comments, uploads and subscription state have isolated contract checks.

Back up the WordPress database, service-key configuration and `glr-private-media` directory outside `public_html` together. A standard uploads backup alone is insufficient. Follow [the production handoff](../docs/production-deployment.md) for Vercel environment configuration and live verification limits.
