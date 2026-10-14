import prisma from "@/lib/db";
import { Header } from "@/components/public/Header";
import { ProjectsShowcase } from "@/components/public/ProjectsShowcase";
import { Footer } from "@/components/public/Footer";

export const metadata = {
  title: "Projects & platforms",
  description:
    "Explore our digital platform initiatives and their development status.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { published: true, status: { not: "ARCHIVED" } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#060814] text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <main id="main-content" className="flex-1 pt-24">
        <ProjectsShowcase projects={projects} />
      </main>
      <Footer />
    </div>
  );
}
