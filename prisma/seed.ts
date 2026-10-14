import { PrismaClient } from "@prisma/client";
import { stat } from "node:fs/promises";
import {
  brandHero,
  brandAbout,
  brandServices,
  brandSettings,
} from "../src/lib/branding";
const prisma = new PrismaClient();
async function main() {
  if (!(await prisma.heroSection.count()))
    await prisma.heroSection.create({
      data: { ...brandHero, published: true },
    });
  for (const [sortOrder, item] of brandAbout.entries())
    await prisma.aboutSection.upsert({
      where: { sectionKey: item.sectionKey },
      update: {},
      create: { ...item, sortOrder, visible: true },
    });
  for (const [sortOrder, item] of brandServices.entries()) {
    if (
      await prisma.service.findFirst({
        where: { slug: { in: [item.slug, item.legacySlug] } },
      })
    )
      continue;
    await prisma.service.create({
      data: {
        title: item.title,
        slug: item.slug,
        shortDescription: item.summary,
        fullContent: "<p>" + item.summary + "</p>",
        icon: item.icon,
        capabilities: JSON.stringify(item.features),
        published: true,
        sortOrder,
      },
    });
  }
  const settings = {
    ...brandSettings,
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    linkedin_url: "",
    twitter_url: "",
    theme_default: "dark",
    homepage_sections: JSON.stringify({
      hero: true,
      about: true,
      services: true,
      projects: true,
      approach: true,
      team: true,
      news: true,
      contact: true,
    }),
  };
  for (const [key, value] of Object.entries(settings))
    await prisma.siteSettings.upsert({
      where: { key },
      update: {},
      create: { key, value, group: "general" },
    });
  for (const filename of [
    "logo-dark.png",
    "logo-light.png",
    "icon-dark.png",
    "icon-light.png",
  ]) {
    const url = "/brand/" + filename;
    if (!(await prisma.media.findFirst({ where: { url } })))
      await prisma.media.create({
        data: {
          filename,
          originalName: filename,
          mimeType: "image/png",
          size: (await stat("public" + url)).size,
          url,
          isProtected: true,
          alt: "Bunyaad Solutions brand asset",
        },
      });
  }
  console.log(
    "Default content added. Existing content and accounts were not overwritten.",
  );
}
main().finally(() => prisma.$disconnect());
