import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
export const uploadRoot=()=>path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_ROOT||"storage/uploads");
export async function uploadFile(file:File) {
 if(!["image/png","image/jpeg","image/webp"].includes(file.type)) throw new Error("Use PNG, JPEG or WebP.");
 if(file.size<1||file.size>5*1024*1024) throw new Error("Images must be at most 5 MB.");
 const input=Buffer.from(await file.arrayBuffer());
 const image=sharp(input,{limitInputPixels:25000000,failOn:"error"});
 const metadata=await image.metadata();
 if(!["png","jpeg","webp"].includes(metadata.format||"")) throw new Error("Invalid image.");
 const buffer=await image.rotate().resize({width:2400,height:2400,fit:"inside",withoutEnlargement:true}).webp({quality:85}).toBuffer();
 const filename=randomUUID()+".webp";await mkdir(uploadRoot(),{recursive:true});await writeFile(path.join(uploadRoot(),filename),buffer,{flag:"wx"});
 return {filename,originalName:file.name.slice(0,200),mimeType:"image/webp",size:buffer.length,url:"/uploads/"+filename};
}
export async function deleteFile(url:string) {
 const filename=url.replace("/uploads/","");
 if(!/^[a-f0-9-]+\.webp$/.test(filename)) throw new Error("Invalid upload path.");
 try{await unlink(path.join(/* turbopackIgnore: true */ uploadRoot(),filename));}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
}
