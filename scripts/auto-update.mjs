// Installed root-owned by install-auto-update.sh. Repository commands run as the app user.
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

export function releaseEnvironment(text, repo) {
  const values = parseEnv(text);
  const url = values.DATABASE_URL;
  if (!url?.startsWith("file:") || /[?#\n\r]/.test(url)) {
    throw new Error(
      "Use a plain SQLite file DATABASE_URL in the repository .env.",
    );
  }
  // Prisma resolves relative SQLite paths against prisma/schema.prisma.
  const database = path.resolve(repo, "prisma", url.slice(5));
  const media = path.resolve(repo, values.MEDIA_ROOT || "storage/uploads");
  const envDatabase =
    path.sep === "\\" ? database.replaceAll("\\", "/") : database;
  const envMedia = path.sep === "\\" ? media.replaceAll("\\", "/") : media;
  if (/["\\\r\n]/.test(envDatabase + envMedia)) {
    throw new Error(
      "Shared data paths cannot contain quotes, backslashes or line breaks.",
    );
  }
  return {
    database,
    media,
    text:
      text +
      "\nDATABASE_URL=" +
      JSON.stringify("file:" + envDatabase) +
      "\nMEDIA_ROOT=" +
      JSON.stringify(envMedia) +
      "\nNODE_ENV=production\n",
  };
}

export function validateConfig(config) {
  for (const key of ["repo", "state", "node", "npm", "home"]) {
    if (!path.isAbsolute(config[key] || "") || /[\r\n]/.test(config[key])) {
      throw new Error(`Invalid absolute path: ${key}`);
    }
  }
  if (
    !Number.isInteger(config.uid) ||
    config.uid <= 0 ||
    !Number.isInteger(config.gid) ||
    config.gid < 0 ||
    !/^[a-zA-Z0-9_-]+$/.test(config.user || "") ||
    config.service !== "bunyaad.service"
  ) {
    throw new Error(
      "Updater requires a non-root app user and bunyaad.service.",
    );
  }
  return config;
}

function command(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
      if (!options.quiet) process.stdout.write(data);
    });
    child.stderr.on("data", (data) => {
      if (!options.quiet) process.stderr.write(data);
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve(output.trim());
      else
        reject(new Error(`${path.basename(file)} failed (${signal || code}).`));
    });
  });
}

async function pointCurrent(state, target) {
  const temporary = path.join(state, "current.next");
  await fs.rm(temporary, { force: true });
  await fs.symlink(target, temporary);
  await fs.rename(temporary, path.join(state, "current"));
}

async function readEnvironment(config) {
  const handle = await fs.open(
    path.join(config.repo, ".env"),
    constants.O_RDONLY |
      (process.platform === "linux" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const info = await handle.stat();
    if (
      !info.isFile() ||
      (process.platform === "linux" && info.uid !== config.uid)
    ) {
      throw new Error(
        "The repository .env must be a regular file owned by the app user.",
      );
    }
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

async function healthy() {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const home = await fetch("http://127.0.0.1:3000/", {
        signal: AbortSignal.timeout(5000),
      });
      if (!home.ok || !(await home.text()).includes("<html"))
        throw new Error("Homepage unavailable");
      const auth = await fetch("http://127.0.0.1:3000/api/auth/csrf", {
        signal: AbortSignal.timeout(5000),
      });
      if (auth.ok && (await auth.json()).csrfToken) return;
    } catch {
      /* Allow the application time to start. */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("The new release did not pass HTTP health checks.");
}

export async function update(
  config,
  {
    execute = command,
    checkHealth = healthy,
    switchRelease = pointCurrent,
  } = {},
) {
  validateConfig(config);
  const env = {
    PATH: [
      ...new Set([
        path.dirname(config.node),
        path.dirname(config.npm),
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
      ]),
    ].join(":"),
    HOME: config.home,
    USER: config.user,
    LOGNAME: config.user,
    LANG: "C.UTF-8",
    GIT_TERMINAL_PROMPT: "0",
    CI: "true",
  };
  const run = (file, args, cwd = config.repo, quiet = false) =>
    execute(file, args, { cwd, uid: config.uid, gid: config.gid, env, quiet });
  const git = (args) => run("git", args, config.repo, true);
  const service = (action) => execute("systemctl", [action, config.service]);
  if (await git(["status", "--porcelain"]))
    throw new Error("Repository has local changes; update skipped.");
  if ((await git(["branch", "--show-current"])) !== "main")
    throw new Error("Checkout must be on main.");
  await git(["fetch", "--no-tags", "origin", "main"]);
  const target = await git(["rev-parse", "FETCH_HEAD"]);
  if (!/^[a-f0-9]{40,64}$/.test(target)) throw new Error("Invalid Git commit.");
  const current = (
    await fs.readFile(path.join(config.state, "deployed-commit"), "utf8")
  ).trim();
  const firstRelease = await fs
    .access(path.join(config.state, "needs-first-release"))
    .then(
      () => true,
      () => false,
    );
  if (target === current && !firstRelease) {
    console.log("Already running latest main: " + target);
    return;
  }
  await git(["merge-base", "--is-ancestor", current, target]);
  await git(["merge-base", "--is-ancestor", "HEAD", target]);

  const oldRelease = await fs.readlink(path.join(config.state, "current"));
  const release = path.join(
    config.state,
    "releases",
    target + "-" + Date.now(),
  );
  await fs.mkdir(release, { mode: 0o750 });
  await fs.chown(release, config.uid, config.gid);
  console.log("Preparing " + target + " in " + release);
  await run("git", [
    "clone",
    "--quiet",
    "--no-hardlinks",
    "--no-checkout",
    config.repo,
    release,
  ]);
  await run("git", ["checkout", "--quiet", "--detach", target], release);
  const originalEnv = await readEnvironment(config);
  const shared = releaseEnvironment(originalEnv, config.repo);
  await fs.access(shared.database); // Never silently create a replacement database.
  await run(config.node, [
    "-e",
    "require('node:fs').mkdirSync(process.argv[1], {recursive:true})",
    shared.media,
  ]);
  await fs.writeFile(path.join(release, ".env"), shared.text, { mode: 0o600 });
  await fs.chown(path.join(release, ".env"), config.uid, config.gid);
  await run(config.npm, ["ci", "--include=dev"], release);
  await run(
    config.node,
    ["node_modules/prisma/build/index.js", "generate"],
    release,
  );
  await run(config.npm, ["run", "check:env"], release);
  // Read-only check: pending migrations require a deliberate manual deployment.
  await run(
    config.node,
    ["node_modules/prisma/build/index.js", "migrate", "status"],
    release,
  );
  await run(config.npm, ["run", "lint"], release);
  await run(config.npm, ["run", "build"], release);
  await run(config.npm, ["test"], release);
  if (await git(["status", "--porcelain"]))
    throw new Error(
      "Local changes appeared during preparation; update skipped.",
    );
  if ((await readEnvironment(config)) !== originalEnv) {
    throw new Error("Environment changed during preparation; update skipped.");
  }
  // Use Node's SQLite backup, independent of the source checkout's installed dependencies.
  await run(config.node, [
    "--input-type=module",
    "-e",
    `
    import { DatabaseSync } from 'node:sqlite';
    import { mkdirSync } from 'node:fs';
    import path from 'node:path';
    const folder = path.resolve('.local-backups');
    mkdirSync(folder, {recursive:true});
    const destination = path.join(folder, 'auto-update-' + Date.now() + '.db');
    const database = new DatabaseSync(process.argv[1]);
    database.exec("VACUUM INTO '" + destination.replaceAll("'", "''") + "'");
    database.close();
    console.log('Database backup: ' + destination);
  `,
    shared.database,
  ]);
  let switched = false;
  try {
    await switchRelease(config.state, release);
    switched = true;
    await service("restart");
    await checkHealth();
    await git(["merge", "--ff-only", target]);
    await fs.writeFile(
      path.join(config.state, "previous-release"),
      oldRelease + "\n",
    );
    await fs.writeFile(
      path.join(config.state, "deployed-commit"),
      target + "\n",
    );
    await fs.rm(path.join(config.state, "needs-first-release"), {
      force: true,
    });
    console.log("Deployed and verified " + target);
  } catch (error) {
    if (switched) {
      console.error("Activation failed. Restoring the previous release.");
      await switchRelease(config.state, oldRelease);
      await service("restart");
      await checkHealth();
      console.error(
        "Previous release restored; the failed release is retained for diagnosis.",
      );
    }
    throw error;
  }
}

async function main() {
  try {
    if (process.platform !== "linux" || process.getuid() !== 0)
      throw new Error("Run through the installed Ubuntu systemd service.");
    const config = JSON.parse(
      await fs.readFile("/etc/bunyaad-auto-update.json", "utf8"),
    );
    await update(config);
  } catch (error) {
    console.error("Automatic update failed: " + error.message);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  void main();
}
