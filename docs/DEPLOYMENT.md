# Deployment and operations

## Supported topology

Run the existing Next.js application as a Node.js service on one host, with a persistent SQLite file and persistent upload directory. This implementation is not suitable for ephemeral/serverless filesystem hosting. The current Prisma schema uses SQLite; changing DATABASE_URL to PostgreSQL alone will not migrate the application.

Use HTTPS at a reverse proxy and bind the application to the appropriate private interface. Set AUTH_URL and NEXT_PUBLIC_SITE_URL to the canonical HTTPS origin. Keep AUTH_SECRET private and stable across restarts.

Only set TRUST_PROXY=true when the proxy overwrites X-Forwarded-For and clients cannot bypass it. Otherwise the application deliberately uses a shared local rate-limit bucket. Production deployments should configure a trusted proxy so unrelated visitors do not share the contact-form quota.

## Release procedure

1. Stop or drain writes for the release window.
2. Take a consistent SQLite backup with `npm run db:backup`. Back up MEDIA_ROOT and public/brand as well. Store off-host backups securely.
3. Keep the existing environment, database, and media files outside any release directory that might be removed.
4. Install the locked dependencies with `npm ci`.
5. Run `npm run check:env`, `npm run db:migrate`, and `npx prisma generate`.
6. Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test`.
7. Start with `npm start` using a service manager. Configure automatic restart, HTTPS, log retention, disk monitoring, and a request-body limit of 6 MB at the proxy.
8. Verify homepage, an authenticated admin page, contact submission, and a media upload.
9. Keep the prior release and backup until the new release is verified.

The seed command is for missing defaults, not a production content synchronization mechanism. It does not overwrite existing content. Do not use `prisma migrate reset` or `db push --force-reset`.

## Existing database baseline

This checkout already had a SQLite database without migration history. Its original schema was recorded as `20261014000000_baseline` and marked applied after backing it up. `20261014010000_cms` safely added session versions, hero alignment, related-project IDs, inquiry archiving, hashed password-reset records, and persistent rate-limit storage.

When installing into an empty database, both migrations run normally. When adopting a separate existing deployment, compare its schema to the baseline first; only mark the baseline applied after confirming it matches. Never blindly resolve a migration on an unknown database.

SQLite implements some column additions by rebuilding tables. The migration copies all existing rows and recreates constraints. Existing application data was retained during this run.

## Recovery

- Stop the application before restoring a database backup.
- Preserve the failed state for diagnosis.
- Restore a matched database and media backup to the configured paths.
- Start a source version compatible with that schema; do not run a destructive down migration.
- Use `npm run admin:reset` for authorized host-assisted account recovery.

The original pre-change source, assets, and database remain under ignored `.local-backups/baseline-20261014/`. These local backups are recovery aids, not deployment artifacts, and must never be publicly served or committed.

## Security and external requirements

- Super Admin manages settings/accounts and destructive deletions. Editors manage content and inquiries.
- Every admin API checks the current database role, active status, and session version. Session lifetime is eight hours.
- Mutation requests require a matching Origin. Auth.js also protects its authentication flows.
- Password hashes use bcrypt with cost 12. Reset tokens are hashed, expire after 30 minutes, and are single use.
- Published HTML is sanitized and rendered with an allowlist. Security headers restrict framing, object content, and resource origins.
- Rate limits use SQLite atomic updates and survive process restarts.
- Contact records and internal notes are only returned through authenticated routes.
- Optional two-factor authentication is not implemented.
- Self-service reset email and outbound contact notifications require a mail provider and an additional delivery integration. Admin-assisted reset links already work without email.
- The production dependency audit is clean at the time of testing. The complete audit reports a high-severity braces advisory through the development ESLint dependency chain. No patched braces release was available from the registry during this run. Do not expose developer tooling as a public service; review upstream updates before release.
- The Prisma configuration dependency deepmerge-ts is pinned through an override to 8.0.2 or a compatible later 8.x release. Migrations, build, and application workflows were tested with the resolved version.

## Company information awaiting confirmation

Five legacy demo projects, four staff profiles, two articles, and sample contact/social details were exact matches for the prior seed script. The records were preserved and hidden or cleared from public settings, with snapshots retained. TekChowk is stored as an unpublished planning initiative. Administrators should review and verify these records before publication. Founder names, biographies, photographs, office details, and real social URLs must come from the company.
