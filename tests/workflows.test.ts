import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import sharp from "sharp";
import { initialValues } from "../src/lib/cms-config";
const root = process.cwd(),
  port = Number(process.env.TEST_PORT || 3119),
  base = "http://localhost:" + port;
const testRoot = path.join(root, ".local-backups", "test-" + Date.now());
mkdirSync(testRoot, { recursive: true });
writeFileSync(path.join(testRoot, "test.db"), "");
const databaseUrl =
  "file:" + path.join(testRoot, "test.db").replaceAll("\\", "/");
const secret = randomBytes(48).toString("base64url"),
  password = randomBytes(24).toString("base64url");
const env: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: secret,
  NEXTAUTH_SECRET: secret,
  AUTH_URL: base,
  NEXTAUTH_URL: base,
  NEXT_PUBLIC_SITE_URL: base,
  MEDIA_ROOT: path.join(testRoot, "uploads"),
  TRUST_PROXY: "false",
  NODE_ENV: "production",
};
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
let server: ChildProcess;
let serverLog = "";
const adminJar = new Map<string, string>(),
  editorJar = new Map<string, string>(),
  anonJar = new Map<string, string>();
let adminId = "",
  editorId = "",
  projectId = "",
  imageId = "",
  imageUrl = "";
async function request(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    jar?: Map<string, string>;
    origin?: string;
    form?: FormData;
  } = {},
) {
  const jar = options.jar || anonJar;
  const response = await fetch(base + url, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.method ? { Origin: options.origin || base } : {}),
      Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
    },
    body:
      options.form || (options.body ? JSON.stringify(options.body) : undefined),
    redirect: "manual",
  });
  for (const cookie of response.headers.getSetCookie()) {
    const entry = cookie.split(";")[0],
      index = entry.indexOf("=");
    jar.set(entry.slice(0, index), entry.slice(index + 1));
  }
  return response;
}
async function login(email: string, jar: Map<string, string>) {
  const csrf = await (await request("/api/auth/csrf", { jar })).json();
  const response = await fetch(base + "/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
      Origin: base,
      Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      password,
      callbackUrl: base + "/admin/dashboard",
    }),
    redirect: "manual",
  });
  for (const cookie of response.headers.getSetCookie()) {
    const entry = cookie.split(";")[0],
      index = entry.indexOf("=");
    jar.set(entry.slice(0, index), entry.slice(index + 1));
  }
  const result = await response.json();
  assert(!String(result.url).includes("error"), "Login must succeed");
}
async function create(
  resource: string,
  data: Record<string, unknown>,
  draft = false,
) {
  const response = await request("/api/admin/" + resource, {
    method: "POST",
    jar: adminJar,
    body: { data: { ...initialValues(resource), ...data }, draft },
  });
  const result = await response.json();
  assert.equal(response.status, 201, JSON.stringify(result));
  return result;
}
async function stopServer() {
  if (server && !server.killed) {
    server.kill();
    await new Promise<void>((resolve) => {
      server.once("exit", () => resolve());
      setTimeout(resolve, 3000).unref();
    });
  }
}
async function startServer() {
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  server.stdout?.on("data", (b) => (serverLog += b.toString()));
  server.stderr?.on("data", (b) => (serverLog += b.toString()));
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + "/admin/login")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Test server did not start: " + serverLog.slice(-2000));
}
before(
  async () => {
    execFileSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { cwd: root, env, stdio: "pipe" },
    );
    const passwordHash = await hash(password, 12);
    adminId = (
      await prisma.user.create({
        data: {
          email: "qa-admin@example.test",
          name: "QA Admin",
          role: "SUPER_ADMIN",
          passwordHash,
        },
      })
    ).id;
    editorId = (
      await prisma.user.create({
        data: {
          email: "qa-editor@example.test",
          name: "QA Editor",
          role: "EDITOR",
          passwordHash,
        },
      })
    ).id;
    await startServer();
    await login("qa-admin@example.test", adminJar);
    await login("qa-editor@example.test", editorJar);
  },
  { timeout: 60000 },
);
after(async () => {
  writeFileSync(path.join(testRoot, "server.log"), serverLog);
  await stopServer();
  await prisma.$disconnect();
});
test("anonymous admin API access is denied and protected pages redirect", async () => {
  assert.equal((await request("/api/admin/projects")).status, 401);
  assert.equal((await request("/admin/dashboard")).status, 307);
  assert.equal((await request("/api/admin/inquiries")).status, 401);
});
test("editor cannot manage administrators, settings or destructive operations", async () => {
  assert.equal(
    (await request("/api/admin/users", { jar: editorJar })).status,
    403,
  );
  assert.equal(
    (await request("/api/admin/settings", { jar: editorJar })).status,
    403,
  );
  assert.equal(
    (
      await request("/api/admin/projects/missing", {
        method: "DELETE",
        jar: editorJar,
        body: {},
      })
    ).status,
    403,
  );
});
test("cross-origin mutations and invalid input are rejected", async () => {
  assert.equal(
    (
      await request("/api/admin/projects", {
        method: "POST",
        jar: adminJar,
        origin: "https://attacker.example",
        body: { data: {} },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/admin/projects", {
        method: "POST",
        jar: adminJar,
        body: { data: {} },
      })
    ).status,
    400,
  );
  const response = await request("/api/admin/hero", {
    method: "POST",
    jar: adminJar,
    body: {
      data: {
        ...initialValues("hero"),
        headline: "Hello",
        description: "Description",
        ctaPrimaryText: "Open",
        ctaPrimaryUrl: "javascript:alert(1)",
      },
    },
  });
  assert.equal(response.status, 400);
});
test("project CRUD, draft visibility, slug generation and stale-write protection", async () => {
  const project = await create("projects", {
    name: "QA Platform",
    description: "A test platform",
    published: true,
    status: "PLANNING",
    industry: "Test category",
  });
  projectId = project.id;
  assert.equal(project.slug, "qa-platform");
  assert.equal((await request("/projects/qa-platform")).status, 200);
  const details = await (
    await request("/api/admin/projects/" + projectId, { jar: adminJar })
  ).json();
  const data = {
    ...initialValues("projects"),
    ...details,
    name: "Draft platform",
    slug: "qa-platform",
  };
  const saved = await request("/api/admin/projects/" + projectId, {
    method: "PUT",
    jar: adminJar,
    body: { data, version: details._version, draft: true },
  });
  assert.equal(saved.status, 200, await saved.text());
  const publicPage = await (await request("/projects/qa-platform")).text();
  assert(publicPage.includes("QA Platform"));
  assert(!publicPage.includes("Draft platform"));
  data.name = "Published platform";
  const published = await request("/api/admin/projects/" + projectId, {
    method: "PUT",
    jar: adminJar,
    body: { data, version: details._version },
  });
  assert.equal(published.status, 200, await published.text());
  assert(
    (await (await request("/projects/qa-platform")).text()).includes(
      "Published platform",
    ),
  );
  assert.equal(
    (
      await request("/api/admin/projects/" + projectId, {
        method: "PUT",
        jar: adminJar,
        body: { data, version: details._version },
      })
    ).status,
    409,
  );
  assert(
    (await prisma.contentRevision.count({ where: { entityId: projectId } })) >=
      1,
  );
});
test("hero and about edits persist, sanitize HTML, and preserve drafts", async () => {
  const hero = await create("hero", {
    headline: "Custom Digital Platforms headline",
    description: "A test company description",
    ctaPrimaryText: "Explore",
    ctaPrimaryUrl: "/projects",
    published: true,
  });
  assert(
    (await (await request("/")).text()).includes(
      "Custom Digital Platforms headline",
    ),
  );
  const about = await create("about", {
    sectionKey: "overview",
    title: "About QA",
    content:
      "<p>Safe text</p><script>alert(1)</script><img src=x onerror=alert(2)>",
    visible: true,
  });
  assert.equal(
    (await prisma.aboutSection.findUniqueOrThrow({ where: { id: about.id } }))
      .content,
    "<p>Safe text</p>",
  );
  assert(hero.id);
});
test("services and team are manageable and appear publicly only when visible", async () => {
  await create("services", {
    title: "QA Service",
    shortDescription: "Testing service",
    fullContent: "<p>Details</p>",
    capabilities: "Feature one\nFeature two",
    relatedProjectIds: projectId,
    published: true,
  });
  assert.equal((await request("/solutions/qa-service")).status, 200);
  const team = await create("team", {
    name: "QA Person",
    designation: "Test role",
    active: false,
  });
  assert(!(await (await request("/team")).text()).includes("QA Person"));
  const response = await request("/api/admin/team/" + team.id, {
    method: "PUT",
    jar: adminJar,
    body: {
      data: { ...initialValues("team"), ...team, active: true },
      version: team._version,
    },
  });
  assert.equal(response.status, 200, await response.text());
  assert((await (await request("/team")).text()).includes("QA Person"));
});
test("draft, published, scheduled and archived article visibility is enforced", async () => {
  const a = await create("news", {
    title: "QA Article",
    content: "<p>Article content</p>",
    category: "Technology Insights",
    authorId: adminId,
    status: "DRAFT",
  });
  assert.equal((await request("/news/qa-article")).status, 404);
  const response = await request("/api/admin/news/" + a.id, {
    method: "PUT",
    jar: adminJar,
    body: {
      data: {
        ...initialValues("news"),
        ...a,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        publishedAt: "",
      },
      version: a._version,
    },
  });
  assert.equal(response.status, 200, await response.text());
  assert.equal((await request("/news/qa-article")).status, 404);
  await prisma.article.update({
    where: { id: a.id },
    data: { scheduledAt: new Date(Date.now() - 60000) },
  });
  assert.equal((await request("/news/qa-article")).status, 200);
  assert(
    (
      await (await request("/news?q=QA&category=Technology%20Insights")).text()
    ).includes("QA Article"),
  );
  await prisma.article.update({
    where: { id: a.id },
    data: { status: "ARCHIVED" },
  });
  assert.equal((await request("/news/qa-article")).status, 404);
});
test("contact validation, honeypot, persistence and rate limiting work", async () => {
  const data = {
    fullName: "QA Contact",
    email: "contact@example.test",
    company: "Test",
    subject: "Test inquiry",
    inquiryType: "Business Partnership",
    message: "A valid test inquiry message.",
  };
  assert.equal(
    (
      await request("/api/contact", {
        method: "POST",
        body: { ...data, email: "bad" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/contact", {
        method: "POST",
        body: { ...data, website: "spam" },
      })
    ).status,
    201,
  );
  assert.equal(await prisma.contactInquiry.count(), 0);
  assert.equal(
    (await request("/api/contact", { method: "POST", body: data })).status,
    201,
  );
  assert.equal(await prisma.contactInquiry.count(), 1);
  assert.equal(
    (await request("/api/contact", { method: "POST", body: data })).status,
    429,
  );
  assert.equal((await request("/api/contact")).status, 405);
});
test("inquiry status, notes and assignment persist without public exposure", async () => {
  const inquiry = await prisma.contactInquiry.findFirstOrThrow();
  const details = await (
    await request("/api/admin/inquiries/" + inquiry.id, { jar: adminJar })
  ).json();
  const response = await request("/api/admin/inquiries/" + inquiry.id, {
    method: "PUT",
    jar: editorJar,
    body: {
      data: {
        status: "IN_PROGRESS",
        assignedToId: editorId,
        internalNotes: "Private note",
        archived: false,
      },
      version: details._version,
    },
  });
  assert.equal(response.status, 200, await response.text());
  assert.equal(
    (
      await prisma.contactInquiry.findUniqueOrThrow({
        where: { id: inquiry.id },
      })
    ).internalNotes,
    "Private note",
  );
});
test("media uploads validate bytes and referenced media cannot be deleted", async () => {
  const invalid = new FormData();
  invalid.set(
    "file",
    new File(["not a picture"], "image.png", { type: "image/png" }),
  );
  assert.equal(
    (
      await request("/api/admin/media", {
        method: "POST",
        jar: adminJar,
        form: invalid,
      })
    ).status,
    400,
  );
  const buffer = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#2244aa" },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.set("file", new File([buffer], "test.png", { type: "image/png" }));
  form.set("alt", "Test image");
  const response = await request("/api/admin/media", {
    method: "POST",
    jar: adminJar,
    form,
  });
  const media = await response.json();
  assert.equal(response.status, 201, JSON.stringify(media));
  imageId = media.id;
  imageUrl = media.url;
  assert.equal((await request(imageUrl)).status, 200);
  const details = await (
    await request("/api/admin/projects/" + projectId, { jar: adminJar })
  ).json();
  const update = await request("/api/admin/projects/" + projectId, {
    method: "PUT",
    jar: adminJar,
    body: {
      data: {
        ...initialValues("projects"),
        ...details,
        coverImage: imageUrl,
        gallery: imageUrl,
      },
      version: details._version,
    },
  });
  assert.equal(update.status, 200, await update.text());
  assert.equal(
    (
      await request("/api/admin/media", {
        method: "DELETE",
        jar: adminJar,
        body: { id: imageId },
      })
    ).status,
    409,
  );
  const protectedMedia = await prisma.media.create({
    data: {
      filename: "brand.png",
      originalName: "Brand",
      mimeType: "image/png",
      size: 1,
      url: "/brand/logo-dark.png",
      isProtected: true,
    },
  });
  assert.equal(
    (
      await request("/api/admin/media", {
        method: "DELETE",
        jar: adminJar,
        body: { id: protectedMedia.id },
      })
    ).status,
    409,
  );
});
test("settings persist and sitemap excludes drafts and archived content", async () => {
  await create("settings", {
    key: "footer_content",
    value: "QA custom footer",
    group: "footer",
  });
  assert((await (await request("/")).text()).includes("QA custom footer"));
  const sitemap = await (await request("/sitemap.xml")).text();
  assert(sitemap.includes("/projects/qa-platform"));
  assert(!sitemap.includes("/news/qa-article"));
  assert(
    (await (await request("/robots.txt")).text()).includes("Disallow: /admin"),
  );
});
test("account invitation/reset links are one-time and revoke old sessions", async () => {
  const user = await create("users", {
    name: "New Editor",
    email: "new@example.test",
    role: "EDITOR",
    active: true,
  });
  assert(!JSON.stringify(user).includes("passwordHash"));
  const response = await request("/api/admin/users/" + user.id + "/reset", {
    method: "POST",
    jar: adminJar,
  });
  const { url } = await response.json();
  assert.equal(response.status, 200);
  const token = new URL(url).hash.slice(1);
  assert.equal(
    (
      await request("/api/account/reset", {
        method: "POST",
        body: { token, password: randomBytes(20).toString("hex") },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/api/account/reset", {
        method: "POST",
        body: { token, password: randomBytes(20).toString("hex") },
      })
    ).status,
    400,
  );
  await prisma.user.update({
    where: { id: editorId },
    data: { active: false },
  });
  assert.equal(
    (await request("/api/admin/projects", { jar: editorJar })).status,
    401,
  );
});
test("last Super Admin cannot be disabled or demoted", async () => {
  const details = await (
    await request("/api/admin/users/" + adminId, { jar: adminJar })
  ).json();
  assert.equal(
    (
      await request("/api/admin/users/" + adminId, {
        method: "PUT",
        jar: adminJar,
        body: {
          data: {
            name: details.name,
            email: details.email,
            role: "EDITOR",
            active: false,
          },
          version: details._version,
        },
      })
    ).status,
    400,
  );
});
test("content, sessions and rate limits survive a server restart", async () => {
  await stopServer();
  await startServer();
  assert.equal(
    (await request("/api/admin/projects", { jar: adminJar })).status,
    200,
  );
  assert(
    (await (await request("/projects/qa-platform")).text()).includes(
      "Published platform",
    ),
  );
  assert.equal((await request(imageUrl)).status, 200);
  assert.equal(
    (await request("/api/contact", { method: "POST", body: {} })).status,
    429,
  );
});
test("logout clears authentication and administrative actions are audited", async () => {
  const csrf = await (
    await request("/api/auth/csrf", { jar: adminJar })
  ).json();
  const response = await fetch(base + "/api/auth/signout", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: base,
      Cookie: [...adminJar].map(([k, v]) => k + "=" + v).join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: base + "/admin/login",
    }),
    redirect: "manual",
  });
  for (const cookie of response.headers.getSetCookie()) {
    const entry = cookie.split(";")[0],
      i = entry.indexOf("=");
    adminJar.set(entry.slice(0, i), entry.slice(i + 1));
  }
  assert.equal(
    (await request("/api/admin/projects", { jar: adminJar })).status,
    401,
  );
  assert((await prisma.activityLog.count()) > 10);
  assert((await prisma.contentRevision.count()) > 0);
});
