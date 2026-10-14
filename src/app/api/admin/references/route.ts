import prisma from "@/lib/db";
import { requireApiUser } from "@/lib/auth-utils";
import { apiError } from "@/lib/security";
export async function GET() {
  try {
    await requireApiUser();
    const [users, projects] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return Response.json(
      { users, projects },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
