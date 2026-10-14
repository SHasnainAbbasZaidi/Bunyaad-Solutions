import Link from "@/components/SiteLink";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { cleanHtml } from "@/lib/security";
import { jsonList } from "@/lib/public-content";
import { PageFrame } from "@/components/public/PageFrame";
async function service(slug: string) {
  return prisma.service.findFirst({ where: { slug, published: true } });
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = await service((await params).slug);
  return s
    ? {
        title: s.title,
        description: s.shortDescription,
        alternates: { canonical: "/solutions/" + s.slug },
      }
    : {};
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = await service((await params).slug);
  if (!s) notFound();
  const projects = await prisma.project.findMany({
    where: {
      id: { in: jsonList(s.relatedProjectIds) },
      published: true,
      status: { not: "ARCHIVED" },
    },
  });
  return (
    <PageFrame>
      <article className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-5xl mb-8">{s.title}</h1>
        <p className="text-xl mb-8">{s.shortDescription}</p>
        {s.image && (
          <img src={s.image} alt={s.title} className="rounded-2xl mb-8" />
        )}
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: cleanHtml(s.fullContent) }}
        />
        <ul className="list-disc pl-6 my-8">
          {jsonList(s.capabilities).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {!!projects.length && (
          <>
            <h2 className="text-2xl mb-4">Related projects</h2>
            {projects.map((p) => (
              <p key={p.id}>
                <Link href={"/projects/" + p.slug}>{p.name} →</Link>
              </p>
            ))}
          </>
        )}
        <Link
          className="inline-block mt-10 text-blue-600 dark:text-blue-400"
          href="/contact"
        >
          Discuss your requirements →
        </Link>
      </article>
    </PageFrame>
  );
}
