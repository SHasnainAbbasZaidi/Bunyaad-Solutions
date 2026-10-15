# Bunyaad Solutions

The existing Next.js website now includes a database-backed CMS. It uses Next.js 16.4, React 19, TypeScript, Prisma 6, SQLite, Auth.js credentials authentication, Tiptap, and the supplied Urdu/English brand assets.

## Requirements

- Node.js 24 LTS and npm.
- A persistent local disk for the SQLite database and uploaded images.
- A single application host behind an HTTPS reverse proxy for production.
- This is a corporate website, with no shopping cart or checkout.

## Local setup (PowerShell)

Run from `E:\ProjectsBuildbyAI\Bunyaad Solution Website\bunyaad-solutions`:

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit your local `.env`. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `NEXT_PUBLIC_SITE_URL`. The two URL values should normally be `http://localhost:3000` locally. Generate a secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Do not overwrite an existing environment file or replace a production database. The existing project database has already been migrated.

```powershell
npm run check:env
npm run db:backup
npm run db:migrate
npm run db:seed
npx prisma generate
npm run dev
```

For a completely new installation, run `db:migrate` before the first backup. The migration wrapper creates an empty SQLite file only if it does not exist, which avoids a Windows Prisma initialization issue. The seed is additive: it does not change existing content, passwords, or account roles.

Open [the website](http://localhost:3000/) or [the admin portal](http://localhost:3000/admin).

## Secure administrator setup

There are no built-in credentials. The previous exposed seed-password account was disabled during the audit and later reactivated locally at the owner's request with a unique temporary password. Those credentials and the database are excluded from Git; fresh installations still require administrator setup below. Public navigation has no admin link; visit `/admin` directly.

For a new Super Admin, set `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` in your private environment. The password must contain at least 12 characters and at most 72 UTF-8 bytes.

```powershell
npm run admin:init
```

This command refuses to overwrite an existing account. Remove `ADMIN_PASSWORD` from the environment after initialization.

To recover an existing account with authorized access to the database host:

```powershell
# Set ADMIN_EMAIL to the account being recovered.
npm run admin:reset
```

This prints a one-time local reset link, valid for 30 minutes. Open it privately and choose a new password. Do not share reset links in public logs. Redeeming a reset revokes existing sessions. The host-assisted recovery command re-enables the selected account but preserves its role.

Super Admins can also create accounts in **Administrators**, enable the account, and choose **Create access / reset link**. Send that link to the intended person through a trusted private channel. Automatic reset email delivery is not configured; no email is sent by this application.

## Editing the website

- **Hero**: headline, description, buttons, image, alignment, and publication.
- **About & approach**: structured sections, including overview, mission, vision, story, values, expertise, philosophy, objectives, and approach.
- **Services**: descriptions, icons, images, features, related projects, order, and visibility.
- **Projects**: category, development status, images/gallery, URL, launch date, featured flag, order, and publication. Projects are presented as creative work without B2B/B2C labels.
- **Team**: photographs, biographies, skills, departments, social links, founder/leadership flags, order, and visibility.
- **News & insights**: rich text, author, category, tags, SEO, featured selection, draft/published/scheduled/archived state.
- **Inquiries**: private messages, status, assigned administrator, internal notes, and archive flag.
- **Media**: image upload, search, selection, previews, and safe deletion.
- **Website settings**: company name and tagline, light/dark logos and icons, contact details, social URLs, header and footer navigation, header call to action, hero highlight cards, footer, SEO, default theme, homepage section visibility, and section headings/descriptions.

For an existing installation using the original business-model messaging, back up the database with `npm run db:backup`, then run `node --env-file=.env --import tsx scripts/rebrand.ts` once. This applies the digital platform and innovation positioning, retains prior versions in revision history, hides speculative sector offerings, and preserves accounts, inquiries, and projects. New installations receive this content from the additive seed. Old service URLs redirect to their renamed pages.

Public content saves invalidate the site layout and refresh the dashboard preview. Switching modules clears the previous editor, superseded searches are cancelled, and requests time out with a recoverable message. Page links show progress during slow navigation, with a full page load option after eight seconds.

**Save changes** applies the values, including the publication/visibility field. **Save draft** preserves published content while storing pending edits. Reopening an entry loads its latest saved draft. **Drafts & revision history** loads an earlier version into the editor; review it and save to apply it. Conflicting edits return an error instead of silently overwriting another editor's changes.

For a new draft, publication is disabled. Enable **Published** / **Visible**, or choose **PUBLISHED** for news, before saving to make it public. Publishing one hero hides other hero records.

The **Display order** field controls service, project, About, and team ordering. Lower numbers appear first. Featured projects/news appear ahead of other entries on the homepage.

### Scheduled publication

Select **SCHEDULED** and a future local date/time. The browser converts it to UTC. Public database queries expose the article once its scheduled timestamp is reached, including detail pages, search results, and sitemap. These routes are dynamic, so this does not require traffic at the exact publication time, a cron service, or a continuously running timer. A scheduled article retains its SCHEDULED status for audit clarity after becoming publicly visible. Do not put public HTML behind a stale full-page CDN cache without explicit invalidation.

### Media

Uploads accept PNG, JPEG, and WebP up to 5 MB and 25 million decoded pixels. Images are validated by decoding, stripped of metadata, resized to fit 2400 × 2400, and encoded as WebP. They are served from a controlled route under `/uploads/`, not an executable upload directory.

Original brand assets remain protected. Deletion is restricted to Super Admins and is blocked when an image is referenced by any content, gallery, draft, settings, or revision history. References in historical revisions intentionally prevent deletion. Database and media directory backups must be retained together.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
npm test
npm audit --omit=dev
```

Integration tests build isolated databases beneath ignored `.local-backups/` and run a production test server on port 3119. Build the current source before running the integration suite. Tests do not touch `prisma/dev.db`. Override `TEST_PORT` if 3119 is occupied. The suite exercises real HTTP authentication, permissions, CRUD, draft isolation, scheduled publication, media, contact forms, reset links, logout, and server restart persistence.

Some restricted Windows execution environments block Node's user-information API used by tsx. Run the test/seed commands in a normal authorized local terminal if that sandbox-only error occurs.

## Production deployment

No live deployment has been performed. See [deployment guidance](docs/DEPLOYMENT.md), [feature audit](docs/FEATURE-AUDIT.md), and [implementation report](docs/IMPLEMENTATION-REPORT.md).

For an existing Ubuntu `bunyaad.service`, [automatic updates](docs/AUTOMATIC-UPDATES.md) can check GitHub at 7 AM and 7 PM Pakistan time, test releases before activation, and roll back failed health checks.
