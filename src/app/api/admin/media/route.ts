import prisma from "@/lib/db";
import { requireApiUser } from "@/lib/auth-utils";
import { uploadFile, deleteFile } from "@/lib/upload";
import { apiError, HttpError, requireSameOrigin, readJson } from "@/lib/security";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
export async function GET(request:Request){
 try{await requireApiUser();const params=new URL(request.url).searchParams;const q=(params.get("q")||"").slice(0,100),page=Math.max(1,Number(params.get("page"))||1);
 const where={originalName:{contains:q}};
 const [rows,total]=await Promise.all([prisma.media.findMany({where,orderBy:{createdAt:"desc"},skip:(page-1)*24,take:24}),prisma.media.count({where})]);
 return Response.json({rows,total},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{requireSameOrigin(request);const user=await requireApiUser();
 const rate=await checkRateLimit("upload:"+user.id,RATE_LIMITS.upload);if(!rate.allowed)return rateLimitResponse(rate.resetIn);
 if(Number(request.headers.get("content-length"))>6*1024*1024)throw new HttpError(413,"Image too large.");
 const form=await request.formData(),file=form.get("file");if(!(file instanceof File))throw new HttpError(400,"Choose an image.");
 let uploaded;try{uploaded=await uploadFile(file);}catch(error){throw new HttpError(400,error instanceof Error?error.message:"Invalid image.");}
 try{const row=await prisma.media.create({data:{...uploaded,alt:String(form.get("alt")||"").slice(0,300),uploadedById:user.id}});
 await prisma.activityLog.create({data:{userId:user.id,action:"UPLOAD",entityType:"media",entityId:row.id}});return Response.json(row,{status:201});}
 catch(error){await deleteFile(uploaded.url);throw error;}
 }catch(error){return apiError(error);}
}
export async function DELETE(request:Request){
 try{requireSameOrigin(request);const user=await requireApiUser(true);const body=await readJson(request);
 const url=await prisma.$transaction(async tx=>{
 const media=await tx.media.findUnique({where:{id:String(body.id)}});if(!media)throw new HttpError(404,"Image not found.");
 if(media.isProtected||media.url.startsWith("/brand/"))throw new HttpError(409,"Brand assets are protected.");
 const sources=await Promise.all([tx.heroSection.findMany(),tx.aboutSection.findMany(),tx.service.findMany(),tx.project.findMany({include:{images:true}}),tx.teamMember.findMany(),tx.article.findMany(),tx.siteSettings.findMany(),tx.contentRevision.findMany()]);
 if(JSON.stringify(sources).includes(media.url))throw new HttpError(409,"This image is referenced by content or revision history.");
 await tx.media.delete({where:{id:media.id}});await tx.activityLog.create({data:{userId:user.id,action:"DELETE",entityType:"media",entityId:media.id}});
 return media.url;
 });await deleteFile(url);return Response.json({success:true});
 }catch(error){return apiError(error);}
}
