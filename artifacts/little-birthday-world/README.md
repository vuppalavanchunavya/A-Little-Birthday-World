# A Little Birthday World

This is a static, mobile-first birthday website. It does not need an account, database, or personal information.

## Personalize it

Edit `src/config/birthdayConfig.ts` to change:

- `name`, `birthday`, and `timezone`
- The personal letter and final birthday message
- Each photo's `src`, `caption`, `date`, and `memory`

To add photos, put image files in `public/photos/` and set each `src` to a relative path such as `photos/sisters-at-the-beach.jpg`. Keep at least one photo entry in the list. The scrapbook and final collage use the first four entries.

## Preview each date state

The normal experience always uses the current time. For local development only, add an ISO timestamp as `previewDate` to the URL:

- Before: `?previewDate=2026-10-29T12:00:00Z`
- Birthday: `?previewDate=2026-10-30T00:00:00Z`
- After: `?previewDate=2026-10-31T12:00:00Z`

The date is interpreted in the configured timezone. This preview parameter is ignored in production.
