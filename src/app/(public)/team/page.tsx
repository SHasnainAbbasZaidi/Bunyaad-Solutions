import prisma from "@/lib/db";
import { Header } from "@/components/public/Header";
import { TeamSection } from "@/components/public/TeamSection";
import { Footer } from "@/components/public/Footer";


export const metadata={"title":"Our team","description":"Meet the people behind Bunyaad Solutions.","alternates":{"canonical":"/team"}};

export default async function TeamPage() {
  const teamMembers = await prisma.teamMember.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#060814] text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <main id="main-content" className="flex-1 pt-24">
        <TeamSection teamMembers={teamMembers} />
      </main>
      <Footer />
    </div>
  );
}
