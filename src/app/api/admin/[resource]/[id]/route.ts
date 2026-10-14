import prisma from "@/lib/db";
import { requireApiUser } from "@/lib/auth-utils";
import { modules } from "@/lib/cms-config";
import { delegate, loadRow, version, saveContent } from "@/lib/cms";
import { apiError, HttpError, readJson, requireSameOrigin } from "@/lib/security";
type Context={params:Promise<{resource:string;id:string}>};
export async function GET(_:Request,context:Context){
 try{
  const {resource,id}=await context.params; await requireApiUser(modules[resource]?.superOnly);
  const row=await loadRow(resource,id);
  const revisions=modules[resource].drafts?await prisma.contentRevision.findMany({where:{entityId:id,entityType:{in:[resource,"draft:"+resource]}},orderBy:{createdAt:"desc"},take:20,include:{user:{select:{name:true}}}}):[];
  return Response.json({...row,_version:version(row),revisions},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
export async function PUT(request:Request,context:Context){
 try{
  requireSameOrigin(request); const {resource,id}=await context.params;
  const user=await requireApiUser(modules[resource]?.superOnly);
  const body=await readJson(request);
  return Response.json(await saveContent(resource,body.data,{id,version:body.version,draft:body.draft===true,user}));
 }catch(error){return apiError(error);}
}
export async function DELETE(request:Request,context:Context){
 try{
  requireSameOrigin(request); const {resource,id}=await context.params;
  const user=await requireApiUser(true);
  if(resource==="users") throw new HttpError(405,"Disable accounts to preserve authorship and audit history.");
  const body=await readJson(request);
  await prisma.$transaction(async tx=>{
   const row=await loadRow(resource,id,tx);
   if(body.version!==version(row)) throw new HttpError(409,"This record changed. Reload before deleting.");
   if(modules[resource].drafts) await tx.contentRevision.create({data:{entityType:resource,entityId:id,content:JSON.stringify(row),userId:user.id}});
   await delegate(resource,tx).delete({where:{id}});
   await tx.activityLog.create({data:{userId:user.id,action:"DELETE",entityType:resource,entityId:id}});
  });
  return Response.json({success:true});
 }catch(error){return apiError(error);}
}
