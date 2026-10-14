import prisma from "@/lib/db";
import { requireApiUser } from "@/lib/auth-utils";
import { issueReset } from "@/lib/password-reset";
import { requireSameOrigin, apiError, HttpError } from "@/lib/security";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{requireSameOrigin(request);const actor=await requireApiUser(true);const {id}=await params;
 const target=await prisma.user.findUnique({where:{id}});if(!target?.active)throw new HttpError(400,"Enable this account first.");
 const token=await issueReset(id);
 await prisma.activityLog.create({data:{userId:actor.id,action:"RESET_ACCESS",entityType:"users",entityId:id}});
 return Response.json({url:new URL("/admin/reset#"+token,process.env.AUTH_URL||process.env.NEXTAUTH_URL||request.url).toString()},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}