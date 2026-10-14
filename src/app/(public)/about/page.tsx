import prisma from "@/lib/db";
import { Header } from "@/components/public/Header";
import { AboutSection } from "@/components/public/AboutSection";
import { Footer } from "@/components/public/Footer";

export const metadata = {
  title: "About us",
  description: "Our mission, vision and approach to digital innovation.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const aboutSections = await prisma.aboutSection.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#060814] text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <main id="main-content" className="flex-1 pt-24">
        <AboutSection aboutSections={aboutSections} />
      </main>
      <Footer />
    </div>
  );
}
