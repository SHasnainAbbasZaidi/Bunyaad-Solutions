import { PrismaClient } from "@prisma/client";
import {
  brandHero,
  brandAbout,
  brandServices,
  brandSettings,
} from "../src/lib/branding";
const prisma = new PrismaClient();
async function main() {
  if (
    await prisma.activityLog.findFirst({
      where: { action: "REBRAND_DIGITAL_INNOVATION" },
    })
  ) {
    console.log(
      "Brand update already applied. Future edits belong in the CMS.",
    );
    return;
  }
  const actor = await prisma.user.findFirst({
    where: { active: true, role: "SUPER_ADMIN" },
  });
  if (!actor)
    throw new Error(
      "An active Super Admin is required for the revision audit.",
    );
  await prisma.$transaction(
    async (tx) => {
      async function preserve(resource: string, row: { id: string }) {
        await tx.contentRevision.updateMany({
          where: { entityType: "draft:" + resource, entityId: row.id },
          data: { entityType: resource },
        });
        await tx.contentRevision.create({
          data: {
            entityType: resource,
            entityId: row.id,
            content: JSON.stringify(row),
            userId: actor!.id,
          },
        });
      }
      for (const row of await tx.heroSection.findMany({
        where: { published: true },
      })) {
        await preserve("hero", row);
        await tx.heroSection.update({ where: { id: row.id }, data: brandHero });
      }
      for (const item of brandAbout) {
        const row = await tx.aboutSection.findUnique({
          where: { sectionKey: item.sectionKey },
        });
        if (row) await preserve("about", row);
        await tx.aboutSection.upsert({
          where: { sectionKey: item.sectionKey },
          update: { title: item.title, content: item.content },
          create: { ...item, visible: true },
        });
      }
      for (const [sortOrder, item] of brandServices.entries()) {
        const row = await tx.service.findFirst({
          where: { slug: { in: [item.legacySlug, item.slug] } },
        });
        const data = {
          title: item.title,
          slug: item.slug,
          shortDescription: item.summary,
          fullContent: `<p>${item.summary}</p>`,
          capabilities: JSON.stringify(item.features),
          targetAudience: "",
          icon: item.icon,
          sortOrder,
          published: true,
        };
        if (row) {
          await preserve("services", row);
          await tx.service.update({ where: { id: row.id }, data });
        } else await tx.service.create({ data });
      }
      for (const row of await tx.service.findMany({
        where: {
          slug: {
            in: [
              "multi-vendor-marketplaces",
              "real-estate-platforms",
              "event-booking-platforms",
            ],
          },
        },
      })) {
        await preserve("services", row);
        await tx.service.update({
          where: { id: row.id },
          data: { published: false },
        });
      }
      for (const [key, value] of Object.entries(brandSettings)) {
        const row = await tx.siteSettings.findUnique({ where: { key } });
        if (row) await preserve("settings", row);
        await tx.siteSettings.upsert({
          where: { key },
          update: { value },
          create: { key, value, group: "branding" },
        });
      }
      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "REBRAND_DIGITAL_INNOVATION",
          entityType: "settings",
          details:
            "Owner-directed positioning as a digital platform and innovation creator; previous content preserved in revisions.",
        },
      });
    },
    { timeout: 30000 },
  );
  console.log(
    "Brand content updated. Prior versions retained; accounts, inquiries, and projects preserved.",
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
