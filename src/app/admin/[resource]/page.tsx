import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { modules } from "@/lib/cms-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentManager } from "@/components/admin/ContentManager";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import prisma from "@/lib/db";
export default async function ModulePage({params,searchParams}:{params:Promise<{resource:string}>;searchParams:Promise<{page?:string}>}){
 const user=await requireAuth(),{resource}=await params;
 if(resource==="media")return <AdminShell><MediaLibrary canDelete={user.role==="SUPER_ADMIN"}/></AdminShell>;
 if(resource==="activity"){
 const page=Math.max(1,Number((await searchParams).page)||1);
 const logs=await prisma.activityLog.findMany({orderBy:{createdAt:"desc"},take:30,skip:(page-1)*30,include:{user:{select:{name:true}}}});
 return <AdminShell><h1>Activity log</h1><div className="overflow-x-auto"><table><thead><tr><th>Time</th><th>Administrator</th><th>Action</th><th>Content</th></tr></thead><tbody>{logs.map(log=><tr key={log.id}><td>{log.createdAt.toISOString()}</td><td>{log.user.name}</td><td>{log.action}</td><td>{log.entityType} · {log.entityId}</td></tr>)}</tbody></table></div><div className="flex gap-4 mt-4">{page>1&&<a href={"?page="+(page-1)}>Previous</a>}{logs.length===30&&<a href={"?page="+(page+1)}>Next</a>}</div></AdminShell>;
 }
 if(!modules[resource]||(modules[resource].superOnly&&user.role!=="SUPER_ADMIN"))notFound();
 return <AdminShell><ContentManager resource={resource} superAdmin={user.role==="SUPER_ADMIN"}/></AdminShell>;
}