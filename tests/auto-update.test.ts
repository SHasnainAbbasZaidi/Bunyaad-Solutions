import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import {
  releaseEnvironment,
  update,
  validateConfig,
} from "../scripts/auto-update.mjs";

const previous = "a".repeat(40),
  latest = "b".repeat(40);
const envPath = (value: string) => value.split(path.sep).join("/");
async function fixture(t: TestContext, failure = "") {
  const parent = path.resolve(".local-backups");
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, "updater-test-"));
  t.after(async () => {
    if (path.dirname(root) !== parent)
      throw new Error("Unexpected test directory");
    await fs.rm(root, { recursive: true, force: true });
  });
  const repo = path.join(root, "repo"),
    state = path.join(root, "state");
  await fs.mkdir(path.join(repo, "prisma"), { recursive: true });
  await fs.mkdir(path.join(state, "releases"), { recursive: true });
  await fs.writeFile(path.join(repo, "prisma", "dev.db"), "fixture");
  await fs.writeFile(
    path.join(repo, ".env"),
    'DATABASE_URL="file:./dev.db"\nMEDIA_ROOT="storage/uploads"\nAUTH_SECRET="private-fixture"\n',
  );
  await fs.writeFile(path.join(state, "deployed-commit"), previous);
  await fs.symlink(repo, path.join(state, "current"), "junction");
  const config = {
    repo,
    state,
    node: process.execPath,
    npm: path.join(root, "npm"),
    uid: process.getuid?.() || 1000,
    gid: process.getgid?.() || 1000,
    user: "testbench",
    home: root,
    service: "bunyaad.service",
  };
  const calls: {
    file: string;
    args: string[];
    options?: { uid?: number; cwd?: string };
  }[] = [];
  const switches: string[] = [];
  let healthCalls = 0;
  const execute = async (file: string, args: string[], options = {}) => {
    calls.push({ file, args, options });
    if (file === "git") {
      if (args[0] === "status") return failure === "dirty" ? " M file" : "";
      if (args[0] === "branch") return "main";
      if (args[0] === "rev-parse")
        return failure === "unchanged" ? previous : latest;
    }
    if (failure === "build" && args.join(" ") === "run build")
      throw new Error("Build failed");
    if (failure === "migrations" && args.includes("migrate"))
      throw new Error("Pending migration");
    if (failure === "tests" && args.join(" ") === "test")
      throw new Error("Workflow test failed");
    return "";
  };
  const dependencies = {
    execute,
    switchRelease: async (_state: string, target: string) => {
      switches.push(target);
    },
    checkHealth: async () => {
      if (failure === "health" && healthCalls++ === 0)
        throw new Error("Unhealthy release");
    },
  };
  return { config, calls, switches, dependencies };
}

test("release environment keeps shared database, uploads and secrets across release folders", () => {
  const repo = path.resolve("example-repo");
  const result = releaseEnvironment(
    'DATABASE_URL="file:./dev.db"\nAUTH_SECRET="keep me"\n',
    repo,
  );
  const parsed = parseEnv(result.text);
  assert.equal(
    parsed.DATABASE_URL,
    "file:" + envPath(path.join(repo, "prisma", "dev.db")),
  );
  assert.equal(
    parsed.MEDIA_ROOT,
    envPath(path.join(repo, "storage", "uploads")),
  );
  assert.equal(parsed.AUTH_SECRET, "keep me");
  assert.equal(parsed.NODE_ENV, "production");
  const absolute = path.resolve("shared", "site.db");
  assert.equal(
    releaseEnvironment(
      `DATABASE_URL=${JSON.stringify("file:" + envPath(absolute))}\n`,
      repo,
    ).database,
    absolute,
  );
  assert.throws(() =>
    releaseEnvironment("DATABASE_URL=postgres://host/db", repo),
  );
});

test("updater rejects root execution for repository commands", async (t) => {
  const f = await fixture(t);
  assert.throws(() => validateConfig({ ...f.config, uid: 0 }));
});

for (const failure of ["dirty", "build", "migrations", "tests"]) {
  test(`automatic update leaves running release untouched after ${failure} failure`, async (t) => {
    const f = await fixture(t, failure);
    await assert.rejects(
      update(f.config, f.dependencies),
      /local changes|Build failed|Pending migration|Workflow test failed/,
    );
    assert.equal(f.switches.length, 0);
    assert(!f.calls.some((c) => c.file === "systemctl"));
    assert.equal(
      await fs.readFile(path.join(f.config.state, "deployed-commit"), "utf8"),
      previous,
    );
  });
}

test("unchanged GitHub main does not install dependencies or restart the app", async (t) => {
  const f = await fixture(t, "unchanged");
  await update(f.config, f.dependencies);
  assert(f.calls.every((c) => c.file === "git"));
  assert.equal(f.switches.length, 0);
});

test("first installation validates and deploys even when checkout already matches GitHub", async (t) => {
  const f = await fixture(t, "unchanged");
  await fs.writeFile(path.join(f.config.state, "needs-first-release"), "");
  await update(f.config, f.dependencies);
  assert.equal(f.switches.length, 1);
  assert(f.calls.some((c) => c.args.join(" ") === "test"));
  await assert.rejects(
    fs.access(path.join(f.config.state, "needs-first-release")),
  );
});

test("successful update tests before switching and runs repository commands without root", async (t) => {
  const f = await fixture(t);
  await update(f.config, f.dependencies);
  const restart = f.calls.findIndex((c) => c.file === "systemctl");
  const tests = f.calls.findIndex((c) => c.args.join(" ") === "test");
  assert(tests >= 0 && tests < restart);
  for (const call of f.calls.filter((c) => c.file !== "systemctl")) {
    assert.equal(call.options?.uid, f.config.uid);
  }
  assert.equal(f.switches.length, 1);
  assert.equal(
    (
      await fs.readFile(path.join(f.config.state, "deployed-commit"), "utf8")
    ).trim(),
    latest,
  );
  const deployedEnv = parseEnv(
    await fs.readFile(path.join(f.switches[0], ".env"), "utf8"),
  );
  assert.equal(
    deployedEnv.DATABASE_URL,
    "file:" + envPath(path.join(f.config.repo, "prisma", "dev.db")),
  );
});

test("failed health check restores previous release and does not advance checkout", async (t) => {
  const f = await fixture(t, "health");
  await assert.rejects(update(f.config, f.dependencies), /Unhealthy release/);
  assert.equal(f.switches.length, 2);
  assert.equal(path.resolve(f.switches[1]), f.config.repo);
  assert.equal(f.calls.filter((c) => c.file === "systemctl").length, 2);
  assert(!f.calls.some((c) => c.file === "git" && c.args[0] === "merge"));
  assert.equal(
    await fs.readFile(path.join(f.config.state, "deployed-commit"), "utf8"),
    previous,
  );
});
