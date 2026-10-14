import prisma from "./db";
import { createHash } from "node:crypto";
export const RATE_LIMITS = {
  login: { maxRequests: 5, windowSeconds: 300 },
  contact: { maxRequests: 3, windowSeconds: 600 },
  upload: { maxRequests: 20, windowSeconds: 60 },
};
export async function checkRateLimit(
  identifier: string,
  config: { maxRequests: number; windowSeconds: number },
) {
  const key = createHash("sha256").update(identifier).digest("hex");
  const now = new Date();
  const expiresAt = new Date(Date.now() + config.windowSeconds * 1000);
  await prisma.$executeRaw`INSERT INTO rate_limits (key, count, expiresAt) VALUES (${key}, 1, ${expiresAt}) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN expiresAt <= ${now} THEN 1 ELSE count + 1 END, expiresAt = CASE WHEN expiresAt <= ${now} THEN ${expiresAt} ELSE expiresAt END`;
  const entry = await prisma.rateLimit.findUniqueOrThrow({ where: { key } });
  await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
  });
  return {
    allowed: entry.count <= config.maxRequests,
    resetIn: Math.max(
      1,
      Math.ceil((entry.expiresAt.getTime() - Date.now()) / 1000),
    ),
  };
}
export function getClientIp(request: Request) {
  return process.env.TRUST_PROXY === "true"
    ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "local";
}
export function rateLimitResponse(resetIn: number) {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(resetIn) } },
  );
}
