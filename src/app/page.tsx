import prisma from "@/lib/db";
import { getSettings, publishedArticles } from "@/lib/public-content";
import { cleanHtml } from "@/lib/security";
import { Header } from "@/components/public/Header";
import { HeroSection } from "@/components/public/HeroSection";
import { ServicesGrid } from "@/components/public/ServicesGrid";
import { ProjectsShowcase } from "@/components/public/ProjectsShowcase";
import { AboutSection } from "@/components/public/AboutSection";
import { TeamSection } from "@/components/public/TeamSection";
import { NewsSection } from "@/components/public/NewsSection";
import { ContactForm } from "@/components/public/ContactForm";
import { Footer } from "@/components/public/Footer";
export const metadata = { alternates: { canonical: "/" } };
export default async function HomePage() {
  const [
    hero,
    services,
    projects,
    aboutSections,
    teamMembers,
    articles,
    settings,
  ] = await Promise.all([
    prisma.heroSection.findFirst({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.service.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.project.findMany({
      where: { published: true, status: { not: "ARCHIVED" } },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      take: 6,
    }),
    prisma.aboutSection.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { active: true },
      orderBy: [{ isFounder: "desc" }, { sortOrder: "asc" }],
      take: 6,
    }),
    prisma.article.findMany({
      where: publishedArticles(),
      orderBy: [
        { featured: "desc" },
        { publishedAt: "desc" },
        { scheduledAt: "desc" },
      ],
      take: 4,
    }),
    getSettings(),
  ]);
  let sections: Record<string, boolean> = {};
  try {
    sections = JSON.parse(settings.homepage_sections || "{}");
  } catch {}
  const show = (key: string) => sections[key] !== false;
  const approach = aboutSections.find((s) => s.sectionKey === "approach");
  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Bunyaad Solutions",
            url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            logo: new URL(
              "/brand/logo-light.png",
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            ).href,
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <main id="main-content" className="flex-1">
        {show("hero") && hero && <HeroSection hero={hero} />}
        {show("about") && (
          <AboutSection
            aboutSections={aboutSections.filter((s) =>
              ["overview", "mission", "vision"].includes(s.sectionKey),
            )}
          />
        )}
        {show("services") && <ServicesGrid services={services} />}
        {show("projects") && <ProjectsShowcase projects={projects} />}
        {show("approach") && approach && (
          <section className="max-w-7xl mx-auto px-6 py-20">
            <h2 className="text-4xl mb-6">{approach.title}</h2>
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: cleanHtml(approach.content) }}
            />
          </section>
        )}
        {show("team") && <TeamSection teamMembers={teamMembers} />}
        {show("news") && <NewsSection articles={articles} />}
        {show("contact") && <ContactForm />}
      </main>
      <Footer />
    </div>
  );
}
