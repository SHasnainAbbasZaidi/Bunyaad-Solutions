import { auth } from "./auth";
import prisma from "./db";
import { redirect } from "next/navigation";
import { HttpError } from "./security";
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const version = (session.user as unknown as { sessionVersion?: number }).sessionVersion;
  if (!user?.active || version !== user.sessionVersion) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
export async function requireAuth() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}
export async function requireApiUser(superOnly = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  if (superOnly && user.role !== "SUPER_ADMIN") throw new HttpError(403, "Super Admin access required.");
  return user;
}