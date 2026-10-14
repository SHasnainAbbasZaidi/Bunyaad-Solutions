import Link from "@/components/SiteLink";
import { cleanHtml } from "@/lib/security";
import { getSettings } from "@/lib/public-content";
export async function AboutSection({
  aboutSections,
}: {
  aboutSections: {
    id: string;
    sectionKey: string;
    title: string;
    content: string;
    image?: string | null;
  }[];
}) {
  const settings = await getSettings();
  let title = "A foundation for digital innovation";
  try {
    title = JSON.parse(settings.section_copy || "{}").about_title || title;
  } catch {}
  return (
    <section
      id="about"
      className="py-24 bg-zinc-50 dark:bg-[#070b18] border-y border-zinc-200 dark:border-zinc-800"
    >
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-blue-600 dark:text-blue-400 mb-3">
          {settings.site_name || "Bunyaad Solutions"}
        </p>
        <h2 className="text-4xl mb-10">{title}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {aboutSections
            .filter((s) => s.sectionKey !== "approach")
            .map((section) => (
              <article
                key={section.id}
                className="p-7 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
              >
                <h3 className="text-2xl mb-4">{section.title}</h3>
                {section.image && (
                  <img
                    src={section.image}
                    alt={section.title}
                    loading="lazy"
                    className="rounded-xl max-h-72 object-cover mb-4"
                  />
                )}
                <div
                  className="prose-content"
                  dangerouslySetInnerHTML={{
                    __html: cleanHtml(section.content),
                  }}
                />
              </article>
            ))}
        </div>
        {!aboutSections.length && (
          <p>Company information will be available soon.</p>
        )}
        <Link
          className="inline-block mt-8 text-blue-600 dark:text-blue-400"
          href="/about"
        >
          About our company →
        </Link>
      </div>
    </section>
  );
}
