import { Header } from "@/components/public/Header";
import { ContactForm } from "@/components/public/ContactForm";
import { Footer } from "@/components/public/Footer";

export const metadata={"title":"Contact us","description":"Start a conversation about development, collaboration or a business partnership.","alternates":{"canonical":"/contact"}};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#060814] text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <main id="main-content" className="flex-1 pt-24">
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}
