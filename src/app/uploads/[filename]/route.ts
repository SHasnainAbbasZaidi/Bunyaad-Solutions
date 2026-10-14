import { readFile } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/db";
import { uploadRoot } from "@/lib/upload";
export async function GET(_:Request,{params}:{params:Promise<{filename:string}>}){
 const {filename}=await params;
 if(!/^[a-f0-9-]+\.webp$/.test(filename))return new Response(null,{status:404});
 if(!await prisma.media.findFirst({where:{filename}}))return new Response(null,{status:404});
 try{const data=await readFile(path.join(uploadRoot(),filename));return new Response(data,{headers:{"Content-Type":"image/webp","X-Content-Type-Options":"nosniff","Cache-Control":"public, max-age=31536000, immutable"}});}catch{return new Response(null,{status:404});}
}