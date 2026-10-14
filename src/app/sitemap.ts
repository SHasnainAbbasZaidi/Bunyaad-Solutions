import type {MetadataRoute} from "next";
import prisma from "@/lib/db";
import {publishedArticles} from "@/lib/public-content";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
 const [projects,articles,services]=await Promise.all([prisma.project.findMany({where:{published:true,status:{not:"ARCHIVED"}},select:{slug:true,updatedAt:true}}),prisma.article.findMany({where:publishedArticles(),select:{slug:true,updatedAt:true}}),prisma.service.findMany({where:{published:true},select:{slug:true,updatedAt:true}})]);
 return [...["","about","solutions","projects","team","news","contact"].map(route=>({url:base+"/"+route})),...projects.map(p=>({url:base+"/projects/"+p.slug,lastModified:p.updatedAt})),...articles.map(p=>({url:base+"/news/"+p.slug,lastModified:p.updatedAt})),...services.map(p=>({url:base+"/solutions/"+p.slug,lastModified:p.updatedAt}))];
}