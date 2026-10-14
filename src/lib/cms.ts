import prisma from "./db";
import { Prisma } from "@prisma/client";
import { modules } from "./cms-config";
import { validateContent } from "./cms-validation";
import { createHash } from "node:crypto";
import { HttpError } from "./security";
type Row = Record<string, unknown> & { id: string };
type Delegate = {
 findMany(args?: object): Promise<Row[]>; findUnique(args: object): Promise<Row|null>;
 create(args: object): Promise<Row>; update(args: object): Promise<Row>; delete(args: object): Promise<Row>; count(args?: object): Promise<number>;
};
export function delegate(resource: string, db: Prisma.TransactionClient = prisma): Delegate {
 const config=modules[resource]; if(!config) throw new HttpError(404,"Unknown module.");
 return (db as unknown as Record<string,Delegate>)[config.model];
}
export function publicRow(row: Row) {
 const result={...row}; delete result.passwordHash; delete result.sessionVersion; return result;
}
export function version(row: Row) { return createHash("sha256").update(JSON.stringify(publicRow(row))).digest("hex"); }
export async function loadRow(resource:string,id:string,db:Prisma.TransactionClient=prisma) {
 const row=await delegate(resource,db).findUnique({where:{id},...(resource==="projects"?{include:{images:{orderBy:{sortOrder:"asc"}}}}:{})});
 if(!row) throw new HttpError(404,"Record not found."); return publicRow(row);
}
export async function saveContent(resource:string,raw:unknown,options:{id?:string;version?:string;draft?:boolean;user:{id:string;role:string}}) {
 if (!modules[resource]) throw new HttpError(404,"Unknown module.");
 if(modules[resource].superOnly && options.user.role!=="SUPER_ADMIN") throw new HttpError(403,"Super Admin access required.");
 if(resource==="inquiries"&&!options.id) throw new HttpError(405,"Inquiries are created by the contact form.");
 const data=validateContent(resource,raw);
 if(resource==="news"&&!data.authorId) data.authorId=options.user.id;
 if(resource==="inquiries"&&!data.assignedToId) data.assignedToId=null;
 const gallery=resource==="projects"?JSON.parse(String(data.gallery||"[]")) as string[]:null;
 delete data.gallery;
 return prisma.$transaction(async tx=>{
  const mediaUrls=modules[resource].fields.filter(f=>f.type==="image").map(f=>data[f.key]).filter((v):v is string=>typeof v==="string"&&!!v);
  if(gallery)mediaUrls.push(...gallery);
  for(const url of new Set(mediaUrls)){
   if(!await tx.media.findFirst({where:{url}}))throw new HttpError(400,"Select an existing image from the media library.");
  }
  let previous:Row|null=null;
  if(options.id) {
   previous=await loadRow(resource,options.id,tx);
   if(!options.version || options.version!==version(previous)) throw new HttpError(409,"This record changed. Reload before saving.");
  }
  if(resource==="users"&&previous && (data.active===false||data.role!=="SUPER_ADMIN") && previous.role==="SUPER_ADMIN" && previous.active) {
   if(await tx.user.count({where:{role:"SUPER_ADMIN",active:true}})<=1) throw new HttpError(400,"Keep at least one active Super Admin.");
  }
  if(resource==="users"&&previous?.id===options.user.id&&(data.active===false||data.role!=="SUPER_ADMIN")) throw new HttpError(400,"You cannot disable or demote your own account.");
  if(resource==="news") {
   const author=await tx.user.findUnique({where:{id:String(data.authorId)}});
   if(!author) throw new HttpError(400,"Choose an existing author.");
  }
  if(resource==="inquiries"&&data.assignedToId) {
   const assignee=await tx.user.findFirst({where:{id:String(data.assignedToId),active:true}});
   if(!assignee) throw new HttpError(400,"Choose an active administrator.");
  }
  if(resource==="services") {
   const ids=JSON.parse(String(data.relatedProjectIds||"[]")) as string[];
   if(await tx.project.count({where:{id:{in:ids}}})!==new Set(ids).size) throw new HttpError(400,"Related project IDs must exist.");
  }
  const snapshot={...data,...(gallery?{gallery:JSON.stringify(gallery)}:{})};
  if(options.draft&&previous&&modules[resource].drafts) {
   await tx.contentRevision.create({data:{entityType:"draft:"+resource,entityId:previous.id,content:JSON.stringify(snapshot),userId:options.user.id}});
   await tx.activityLog.create({data:{userId:options.user.id,action:"SAVE_DRAFT",entityType:resource,entityId:previous.id}});
   return {...previous,_version:version(previous)};
  }
  if(previous && modules[resource].drafts) await tx.contentRevision.create({data:{entityType:resource,entityId:previous.id,content:JSON.stringify(previous),userId:options.user.id}});
  if(options.draft) {
   if("published"in data) data.published=false;
   if("visible"in data) data.visible=false;
   if(resource==="team") data.active=false;
   if(resource==="news") data.status="DRAFT";
  }
  if(resource==="users") {
   if(!previous) data.passwordHash="!INVITATION_REQUIRED";
   else if(previous.role!==data.role || previous.active!==data.active) data.sessionVersion={increment:1};
  }
  if(resource==="projects") data.images={...(previous?{deleteMany:{}}:{}),create:gallery!.map((url,sortOrder)=>({url,sortOrder}))};
  if(resource==="hero"&&data.published) await tx.heroSection.updateMany({where:{published:true,...(previous?{id:{not:previous.id}}:{})},data:{published:false}});
  const row=previous?await delegate(resource,tx).update({where:{id:previous.id},data}):await delegate(resource,tx).create({data});
  await tx.contentRevision.deleteMany({where:{entityType:"draft:"+resource,entityId:row.id}});
  await tx.activityLog.create({data:{userId:options.user.id,action:previous?"UPDATE":"CREATE",entityType:resource,entityId:row.id}});
  if(data.published===true||data.visible===true||data.status==="PUBLISHED"||data.status==="SCHEDULED") await tx.activityLog.create({data:{userId:options.user.id,action:data.status==="SCHEDULED"?"SCHEDULE":"PUBLISH",entityType:resource,entityId:row.id}});
  const result=await loadRow(resource,row.id,tx); return {...result,_version:version(result)};
 });
}
