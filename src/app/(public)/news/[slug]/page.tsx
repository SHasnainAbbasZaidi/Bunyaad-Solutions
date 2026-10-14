import {notFound} from "next/navigation";
import prisma from "@/lib/db";
import {publishedArticles,jsonList} from "@/lib/public-content";
import {cleanHtml} from "@/lib/security";
import {PageFrame} from "@/components/public/PageFrame";
import {NewsSection} from "@/components/public/NewsSection";
async function article(slug:string){return prisma.article.findFirst({where:{AND:[{slug},publishedArticles()]},include:{author:{select:{name:true}}}});}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const a=await article((await params).slug);if(!a)return {};return {title:a.seoTitle||a.title,description:a.seoDescription||a.excerpt,alternates:{canonical:"/news/"+a.slug},openGraph:{type:"article",title:a.title,description:a.excerpt||"",images:a.coverImage?[a.coverImage]:[],publishedTime:(a.publishedAt||a.scheduledAt)?.toISOString()},twitter:{card:"summary_large_image" as const,title:a.title,description:a.excerpt||""}};}
export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
 const a=await article((await params).slug);if(!a)notFound();
 const related=await prisma.article.findMany({where:{AND:[publishedArticles(),{category:a.category,id:{not:a.id}}]},take:3});
 return <PageFrame><article className="max-w-3xl mx-auto px-6 py-12"><p className="text-blue-600 dark:text-blue-400">{a.category}</p><h1 className="text-4xl md:text-5xl my-5">{a.title}</h1><p className="text-sm text-zinc-500">{a.author.name} · {(a.publishedAt||a.scheduledAt||a.createdAt).toLocaleDateString("en-GB")}</p>{a.coverImage&&<img src={a.coverImage} alt={a.title} className="w-full rounded-2xl my-8"/>}<p className="text-xl my-8">{a.excerpt}</p><div className="prose-content" dangerouslySetInnerHTML={{__html:cleanHtml(a.content)}}/><div className="flex gap-3 mt-8">{jsonList(a.tags).map(tag=><span key={tag}>#{tag}</span>)}</div></article><NewsSection articles={related}/></PageFrame>;
}