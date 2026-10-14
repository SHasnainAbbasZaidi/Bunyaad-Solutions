import prisma from "@/lib/db";
import { z } from "zod";
import { inquiryCategories } from "@/lib/cms-config";
import {
  requireSameOrigin,
  readJson,
  apiError,
  HttpError,
} from "@/lib/security";
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  company: z.string().max(100).optional(),
  subject: z.string().trim().min(3).max(200),
  inquiryType: z.string().refine((v) => inquiryCategories.includes(v)),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(500).optional(),
});
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const rate = await checkRateLimit(
      "contact:" + getClientIp(request),
      RATE_LIMITS.contact,
    );
    if (!rate.allowed) return rateLimitResponse(rate.resetIn);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "Please check your name, email, category, subject and message.",
      );
    const { website, ...data } = parsed.data;
    if (website) return Response.json({ success: true }, { status: 201 });
    await prisma.contactInquiry.create({ data });
    return Response.json(
      { success: true, message: "Your inquiry has been received." },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
