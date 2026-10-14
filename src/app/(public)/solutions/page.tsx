import prisma from "@/lib/db";
import { Header } from "@/components/public/Header";
import { ServicesGrid } from "@/components/public/ServicesGrid";
import { Footer } from "@/components/public/Footer";


export const metadata={"title":"Services","description":"B2B, B2C, D2C, SaaS and enterprise software solutions.","alternates":{"canonical":"/solutions"}};

export default async function SolutionsPage() {
  const services = await prisma.service.findMany({
    where: { published: true,  },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#060814] text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <main id="main-content" className="flex-1 pt-24">
        <ServicesGrid services={services} />
      </main>
      <Footer />
    </div>
  );
}
