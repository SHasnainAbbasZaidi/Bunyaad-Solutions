import prisma from "./db";
import { randomBytes, createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { HttpError } from "./security";
export async function issueReset(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.$transaction([
    prisma.passwordReset.deleteMany({ where: { userId } }),
    prisma.passwordReset.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 30 * 60000) },
    }),
  ]);
  return token;
}
export async function redeemReset(token: string, password: string) {
  if (
    !/^[a-f0-9]{64}$/.test(token) ||
    password.length < 12 ||
    password.length > 128 ||
    Buffer.byteLength(password) > 72
  )
    throw new HttpError(400, "Use a valid link and a password of 12–72 bytes.");
  const tokenHash = createHash("sha256").update(token).digest("hex"),
    passwordHash = await hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const reset = await tx.passwordReset.findUnique({ where: { tokenHash } });
    if (!reset || reset.expiresAt < new Date())
      throw new HttpError(400, "This link is invalid or expired.");
    const user = await tx.user.findUnique({ where: { id: reset.userId } });
    if (!user?.active)
      throw new HttpError(400, "This link is invalid or expired.");
    await tx.passwordReset.delete({ where: { id: reset.id } });
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        entityType: "users",
        entityId: user.id,
      },
    });
  });
}
