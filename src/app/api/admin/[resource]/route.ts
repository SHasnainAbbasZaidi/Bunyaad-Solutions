import { requireApiUser } from "@/lib/auth-utils";
import { modules } from "@/lib/cms-config";
import { delegate, publicRow, version, saveContent } from "@/lib/cms";
import {
  apiError,
  HttpError,
  readJson,
  requireSameOrigin,
} from "@/lib/security";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { resource } = await context.params;
    if (!modules[resource]) throw new HttpError(404, "Unknown module.");
    await requireApiUser(modules[resource].superOnly);
    const query = new URL(request.url).searchParams;
    const page = Math.max(1, Number(query.get("page")) || 1);
    const q = (query.get("q") || "").slice(0, 200);
    const searchKeys: Record<string, string[]> = {
      hero: ["headline"],
      about: ["title"],
      services: ["title"],
      projects: ["name", "industry"],
      team: ["name"],
      news: ["title", "category"],
      inquiries: ["fullName", "email", "subject"],
      settings: ["key"],
      users: ["name", "email"],
    };
    const where: Record<string, unknown> = q
      ? { OR: searchKeys[resource].map((key) => ({ [key]: { contains: q } })) }
      : {};
    const status = query.get("status");
    if (status && ["projects", "news", "inquiries"].includes(resource))
      where.status = status;
    const sort =
      resource === "settings" ? { key: "asc" } : { createdAt: "desc" };
    const [rows, total] = await Promise.all([
      delegate(resource).findMany({
        where,
        orderBy: sort,
        skip: (page - 1) * 20,
        take: 20,
      }),
      delegate(resource).count({ where }),
    ]);
    return Response.json(
      {
        rows: rows.map((row) => ({
          ...publicRow(row),
          _version: version(row),
        })),
        total,
        page,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const { resource } = await context.params;
    const user = await requireApiUser(modules[resource]?.superOnly);
    const body = await readJson(request);
    const row = await saveContent(resource, body.data, {
      user,
      draft: body.draft === true,
    });
    return Response.json(row, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
