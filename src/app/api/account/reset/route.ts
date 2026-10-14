import { redeemReset } from "@/lib/password-reset";
import {
  requireSameOrigin,
  apiError,
  readJson,
  HttpError,
} from "@/lib/security";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const limit = await checkRateLimit("reset:" + getClientIp(request), {
      maxRequests: 10,
      windowSeconds: 600,
    });
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);
    const body = await readJson(request);
    if (typeof body.token !== "string" || typeof body.password !== "string")
      throw new HttpError(400, "Invalid request.");
    await redeemReset(body.token, body.password);
    return Response.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
