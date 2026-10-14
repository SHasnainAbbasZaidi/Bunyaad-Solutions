import prisma from "@/lib/db";
import { requireApiUser } from "@/lib/auth-utils";
import { apiError } from "@/lib/security";
export async function GET(request:Request){
 try{await requireApiUser();const page=Math.max(1,Number(new URL(request.url).searchParams.get("page"))||1);
 const [rows,total]=await Promise.all([prisma.activityLog.findMany({orderBy:{createdAt:"desc"},take:30,skip:(page-1)*30,include:{user:{select:{name:true}}}}),prisma.activityLog.count()]);
 return Response.json({rows,total},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
