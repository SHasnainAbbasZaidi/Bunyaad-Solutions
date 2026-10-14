import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanHtml,
  safeUrl,
  readJson,
  readLimitedBody,
  HttpError,
} from "../src/lib/security";
import { validateContent } from "../src/lib/cms-validation";
import { initialValues } from "../src/lib/cms-config";
test("HTML sanitizer removes active content and unsafe link schemes", () => {
  const output = cleanHtml(
    '<p onclick="evil()">Text</p><iframe src="https://example.com"></iframe><a href="javascript:alert(1)">link</a><script>evil()</script>',
  );
  assert.equal(output, "<p>Text</p><a>link</a>");
  for (const value of [
    "javascript:alert(1)",
    "//attacker.test",
    "/\\attacker.test",
    "data:text/html,hello",
    "https://example.com\n",
  ])
    assert.equal(safeUrl(value), false, value);
  assert.equal(safeUrl("/contact"), true);
  assert.equal(safeUrl("https://example.com"), true);
});
test("JSON and streaming upload bodies enforce size limits without Content-Length", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: "x".repeat(256001) }),
  });
  await assert.rejects(
    readJson(request),
    (e: unknown) => e instanceof HttpError && e.status === 413,
  );
  const upload = new Request("https://example.test", {
    method: "POST",
    body: "a".repeat(1000),
  });
  await assert.rejects(
    readLimitedBody(upload, 100),
    (e: unknown) => e instanceof HttpError && e.status === 413,
  );
});
test("invalid publication states, lists and dates are rejected", () => {
  const data = {
    ...initialValues("projects"),
    name: "Example",
    description: "Example",
  };
  assert.throws(() =>
    validateContent("projects", { ...data, status: "LAUNCHED" }),
  );
  assert.throws(() =>
    validateContent("projects", { ...data, technologies: "[1,2]" }),
  );
  assert.throws(() =>
    validateContent("projects", { ...data, launchDate: "not-a-date" }),
  );
  assert.throws(() =>
    validateContent("news", {
      ...initialValues("news"),
      title: "Example",
      content: "<p>Example</p>",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() - 1000).toISOString(),
    }),
  );
});
test("navigation settings reject unsafe destinations and unknown configuration keys", () => {
  assert.throws(() =>
    validateContent("settings", {
      key: "DATABASE_URL",
      value: "secret",
      group: "general",
    }),
  );
  assert.throws(() =>
    validateContent("settings", {
      key: "navigation",
      value: '[{"name":"Bad","href":"javascript:alert(1)"}]',
      group: "navigation",
    }),
  );
  assert.throws(() =>
    validateContent("settings", {
      key: "homepage_sections",
      value: '{"hero":"false"}',
      group: "general",
    }),
  );
});
