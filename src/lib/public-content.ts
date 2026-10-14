import prisma from "./db";
import type { Prisma } from "@prisma/client";
export function publishedArticles(): Prisma.ArticleWhereInput {
  const now = new Date();
  return {
    OR: [
      {
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      },
      { status: "SCHEDULED", scheduledAt: { lte: now } },
    ],
  };
}
// Time-gated reads publish even when the site has no traffic at the scheduled instant.
// No process timer, external cron, or stale static cache is required.
export async function getSettings() {
  const rows = await prisma.siteSettings.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
export function jsonList(value?: string | null): string[] {
  try {
    const list = JSON.parse(value || "[]");
    return Array.isArray(list) ? list.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
