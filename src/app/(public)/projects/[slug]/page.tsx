import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { cleanHtml } from "@/lib/security";
import { jsonList } from "@/lib/public-content";
import { PageFrame } from "@/components/public/PageFrame";
async function project(slug: string) {
  return prisma.project.findFirst({
    where: { slug, published: true, status: { not: "ARCHIVED" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await project((await params).slug);
  return p
    ? {
        title: p.name,
        description: p.description,
        alternates: { canonical: "/projects/" + p.slug },
        openGraph: {
          title: p.name,
          description: p.description,
          images: p.coverImage ? [p.coverImage] : [],
        },
      }
    : {};
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await project((await params).slug);
  if (!p) notFound();
  return (
    <PageFrame>
      <article className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-blue-600 dark:text-blue-400">
          {p.industry} · {p.status.replaceAll("_", " ")}
        </p>
        {p.logo && (
          <img src={p.logo} alt={p.name + " logo"} className="max-h-24 mt-8" />
        )}
        <h1 className="text-5xl my-6">{p.name}</h1>
        <p className="text-xl mb-8">{p.description}</p>
        {p.coverImage && (
          <img
            src={p.coverImage}
            alt={p.name}
            className="w-full rounded-2xl mb-10"
          />
        )}
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: cleanHtml(p.fullContent || "") }}
        />
        {p.launchDate && (
          <p>Launch date: {p.launchDate.toLocaleDateString("en-GB")}</p>
        )}
        <div className="flex flex-wrap gap-3 my-8">
          {jsonList(p.technologies).map((t) => (
            <span key={t} className="border rounded-lg p-2">
              {t}
            </span>
          ))}
        </div>
        {p.externalUrl && (
          <a
            className="text-blue-600 dark:text-blue-400"
            href={p.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit project website ↗
          </a>
        )}
        <div className="grid md:grid-cols-2 gap-6 my-10">
          {p.images.map((image) => (
            <figure key={image.id}>
              <img
                src={image.url}
                alt={image.caption || p.name + " screenshot"}
                loading="lazy"
                className="rounded-xl"
              />
              {image.caption && <figcaption>{image.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </article>
    </PageFrame>
  );
}
