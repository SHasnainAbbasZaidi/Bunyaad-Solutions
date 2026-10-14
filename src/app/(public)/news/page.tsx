import Link from "@/components/SiteLink";
import prisma from "@/lib/db";
import { publishedArticles } from "@/lib/public-content";
import { categories } from "@/lib/cms-config";
import { NewsSection } from "@/components/public/NewsSection";
import { PageFrame } from "@/components/public/PageFrame";
export const metadata = {
  title: "News & insights",
  description:
    "Company announcements, product updates and technology insights.",
  alternates: { canonical: "/news" },
};
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams,
    q = (params.q || "").slice(0, 200),
    category = params.category || "",
    page = Math.max(1, Number(params.page) || 1);
  const where = {
    AND: [
      publishedArticles(),
      { title: { contains: q } },
      ...(category ? [{ category }] : []),
    ],
  };
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [
        { featured: "desc" },
        { publishedAt: "desc" },
        { scheduledAt: "desc" },
      ],
      take: 8,
      skip: (page - 1) * 8,
    }),
    prisma.article.count({ where }),
  ]);
  const link = (p: number) =>
    "/news?" + new URLSearchParams({ q, category, page: String(p) });
  return (
    <PageFrame>
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl mb-6">News & insights</h1>
        <form className="public-filters">
          <label>
            Search
            <input name="q" defaultValue={q} />
          </label>
          <label>
            Category
            <select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button>Search articles</button>
        </form>
        {!total && (
          <p className="py-16">No published articles match your search.</p>
        )}
      </div>
      <NewsSection articles={articles} />
      <nav
        aria-label="News pages"
        className="max-w-7xl mx-auto px-6 pb-12 flex gap-8"
      >
        {page > 1 && <Link href={link(page - 1)}>Previous</Link>}
        <span>
          Page {page} · {total} articles
        </span>
        {page * 8 < total && <Link href={link(page + 1)}>Next</Link>}
      </nav>
    </PageFrame>
  );
}
