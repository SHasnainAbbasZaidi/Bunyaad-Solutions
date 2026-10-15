# Automatic Ubuntu updates

The Ubuntu machine checks GitHub `origin/main` every day at **07:00 and 19:00 Asia/Karachi**. This pulls approved code from GitHub; it does not commit or push development files. systemd may dispatch within one minute of the scheduled time. A missed run is caught up after the machine starts again.

## Install once

First finish the administrator/rebrand setup and verify the Ubuntu application works locally. The existing `bunyaad.service` must run as a non-root user, use this repository, and serve port 3000. Node 24+, npm, Git, curl, util-linux (`flock` and `runuser`), and systemd are required. The coordinator requires root-owned, system-wide Node 24+ at `/usr/bin/node`; application builds may use a separate Node installation. The repository `.env` must be a regular file owned by the app user. Keep the service's database and uploaded files in place.

Run as the normal application owner, from the existing checkout:

```bash
cd ~/Bunyaad-Solutions
git pull --ff-only origin main
sudo bash scripts/install-auto-update.sh "$(command -v node)" "$(command -v npm)"
```

The installer records the existing service user and Node/npm locations. It installs a root-owned updater under `/usr/local/lib/bunyaad-auto-update`, a config file at `/etc/bunyaad-auto-update.json`, and a timer/service. It adds `bunyaad.service.d/auto-update.conf` to use the active release's working directory and `.env`, and starts Next directly on the existing port 3000 and address 0.0.0.0. Other unit options remain in effect. It uses the repository `.env` as the source of environment settings; transfer any settings from other EnvironmentFiles into that private file before installing. The existing application keeps running during installation.

No passwordless sudo permission is granted to the app user. The root-owned coordinator handles service restarts; Git, dependency installation, Prisma checks, builds, tests, and database backups run as the non-root app user. If Node/npm move after an upgrade, rerun the installer with their new paths.

Check scheduling, trigger a check, and inspect the result:

```bash
systemctl list-timers bunyaad-auto-update.timer --no-pager
sudo systemctl start bunyaad-auto-update.service
sudo journalctl -u bunyaad-auto-update.service -n 100 --no-pager
```

## Update behavior

1. Require a clean source checkout on `main`. Fetch `origin/main`; refuse divergent or rewound history. If the deployed commit already matches, do nothing.
2. Clone the fetched commit into a separate release folder. Keep the live service running while preparing it.
3. Copy the private environment with restrictive permissions. Convert SQLite and upload paths to absolute paths referencing the original shared data.
4. Run locked dependency installation, Prisma generation, environment validation, read-only migration status, lint, production build, and workflow tests. Any failure leaves the running release untouched.
5. Take a consistent SQLite backup in the source checkout's `.local-backups/` directory.
6. Switch the active release, restart `bunyaad.service`, and check the homepage and authentication endpoint. If activation fails, restore the previous release and restart it.
7. After success, fast-forward the source checkout and record the deployed commit. This keeps future `git pull` commands consistent with the deployed code.

The new version is built before switching, but restarting a single application process causes a brief interruption. Do not manually edit or deploy this checkout while an update is running. The updater lock prevents overlapping scheduled/manual updater runs; it does not lock your text editor or ordinary Git commands.

## Data and manual releases

The updater **does not run database migrations, seed data, rebrand content, or synchronize the Windows database**. If migration status reports pending migrations, perform a manual maintenance release with database/media backups, apply the reviewed migration against the existing database, and run the updater again. An existing active release must remain compatible with the migration, or keep the application stopped until the new release is activated. An update failure never restores a database backup automatically, because doing so could discard recent inquiries or content edits.

Continue editing production content through `/admin`. Future intentional default-content changes need their own explicit content migration. The one-time digital innovation rebrand remains `node --env-file=.env --import tsx scripts/rebrand.ts` after backup and active administrator setup.

Releases and diagnostic failed builds are retained under `/var/lib/bunyaad-auto-update/releases`. Monitor disk space and periodically remove old releases only after checking the `current` symlink and `previous-release` file; neither active nor rollback release should be removed. Keep database and media backups off-host. Journal logs record failures; email/push notifications are not configured. Check that the source checkout's GitHub credentials work noninteractively if the repository is private.

Disable future checks:

```bash
sudo systemctl disable --now bunyaad-auto-update.timer
```

Disabling the timer does not interrupt an update already running. Wait for it to finish before manual deployment. The active app continues to use its release folder. To return to the original checkout, disable the timer, complete a manual build there, remove **only** `/etc/systemd/system/bunyaad.service.d/auto-update.conf`, run `sudo systemctl daemon-reload`, then restart `bunyaad`. Do not use `systemctl revert` if you have other custom drop-ins.
