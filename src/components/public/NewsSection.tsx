"use client";
import Link from "@/components/SiteLink";
import { useSiteSettings, sectionCopy } from "./SiteContext";
import { Calendar, ArrowRight } from "lucide-react";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  category: string;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
  coverImage?: string | null;
}

export function NewsSection({ articles }: { articles: ArticleItem[] }) {
  const settings = useSiteSettings();
  if (!articles || articles.length === 0) return null;

  return (
    <section
      id="news"
      className="py-24 bg-zinc-50/60 dark:bg-[#070b18]/60 border-t border-zinc-200/60 dark:border-zinc-800/60 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
              {sectionCopy(settings, "news_eyebrow", "Ideas & updates")}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {sectionCopy(
                settings,
                "news_title",
                "Company News & Perspectives",
              )}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl text-base sm:text-lg">
              {sectionCopy(
                settings,
                "news_description",
                "Company announcements and technology insights.",
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => {
            const dateStr =
              article.publishedAt || article.scheduledAt
                ? new Date(
                    (article.publishedAt || article.scheduledAt)!,
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Recent";

            return (
              <div
                key={article.id}
                className="group flex flex-col justify-between p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all duration-300"
              >
                <div>
                  {article.coverImage && (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-48 object-cover rounded-xl mb-5"
                    />
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4">
                    <span className="font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/40">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Link
                    href={"/news/" + article.slug}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
