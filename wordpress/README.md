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
5. In the report editor toolbar, use **Upload media** to upload or choose an existing file, enter its description/link text and optional caption, then select **Insert media**. Images appear inline, video/audio use players, and documents become download links. The same toolbar button is available in Code mode. **GLR Media** also manages these files; category and report covers still require images.
6. **GLR Enquiries** manages enquiry status. **GLR Subscribers** displays subscriber state and consent metadata and supports status changes. Administrators can assign the GLR Editor role to editorial staff.
7. Comments are disabled server-side, regardless of editor settings. There is no public comment UI in the Next.js site.
8. Administrators can select **Preview report** in the Publish panel. It opens the current unsaved title, summary, body, category and byline in a private article preview, including uploaded inline images, audio, video and document links. It does not save or publish the report. Save newly selected cover images first. This is a CMS content preview, not the complete frontend page layout. Preview requests require an administrator session, permission to edit that report and a report-specific nonce; previews are not cached or publicly shareable.

## Plugin packaging

The packaging helper copies the plugin and writes its service-token verifier into a private directory outside this repository. Reuse the existing credentials file to preserve frontend access:

```powershell
node wordpress/scripts/stage-plugin.mjs C:/path/to/private-staging
```

Packaging does not deploy anything. The plugin no longer contains the retired one-time import/audit routes. Stable imported content IDs remain supported so existing records and URLs keep working.

The three visible formatting rows provide headings, font family/size, bold/italic/underline/strikethrough, colours, lists, quotations, alignment, indentation, links, table insertion, horizontal rules, undo/redo, paste as text, clear formatting, special characters, subscript/superscript and fullscreen. Use the Visual tab; WordPress profile settings must allow the visual editor. Table cells are editable in the visual editor. This is a web article editor, so Word document page layout, tracked changes and macros are not available.

Version 1.2.0 replaces the separate image button with **Upload media** inside both editor toolbars. Supported files: JPEG/PNG/WebP/GIF/AVIF; MP4/M4V/WebM/OGV/MOV; MP3/M4A/WAV/OGG/FLAC/AAC; PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ODT/ODS/ODP, RTF, TXT, CSV and ZIP. Files are validated using WordPress's file-type/content checks and an explicit allowlist. HTML, SVG, scripts and executable files are not accepted. The maximum is 64 MB per file, or the hosting upload limit if smaller; the picker displays the effective limit. Playback depends on the browser's support for the file's codec; files are not transcoded.

All originals stay outside `public_html`. Authenticated editor previews work before publication. Public requests still require a reference in published content, including each byte-range request. Audio/video support full, bounded, open-ended and suffix byte ranges; documents are served as attachments with their filename. Legacy inline image URLs retain their sizes when normalized to the current image service. The frontend media/sanitizer/proxy changes need the normal Vercel deployment.

On 24 October 2026, version 1.2.0 was installed only on the GLR WordPress site. Live verification uploaded WAV, MP4 and TXT fixtures, checked the video preview, inserted them through both toolbar modes, saved an unpublished draft and checked that only stable frontend URLs were stored. The temporary report was moved to recoverable Trash; the three clearly named `GLR-media-verification` files remain private in GLR Media. No existing report was saved or published. Full and partial byte delivery was verified through the production CMS and local Next.js proxy, including invalid/unsatisfiable ranges. Other listed formats and browser codecs were not individually exercised.

## Verification and recovery

On 24 October 2026, version 1.3.0 was installed only on the GLR WordPress site. Administrator report previews were verified live from Visual and Code modes, including cover and inline images. Anonymous report-preview and private-media requests were rejected. No existing report was saved or published during verification. Unsaved-content submission and administrator/report-specific permission checks also passed locally; audio/video playback was not repeated for this preview update.

Run `npm test`, `npm run build`, `php -l wordpress/glr-cms/glr-cms.php` and `php wordpress/tests/contracts.php`. Publication, authentication, comments, uploads and subscription state have isolated contract checks.

Back up the WordPress database, service-key configuration and `glr-private-media` directory outside `public_html` together. A standard uploads backup alone is insufficient. Follow [the production handoff](../docs/production-deployment.md) for Vercel environment configuration and live verification limits.
