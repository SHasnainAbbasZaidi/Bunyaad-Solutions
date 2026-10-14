import prisma from "../src/lib/db";
import {hash} from "bcryptjs";
import {issueReset} from "../src/lib/password-reset";
async function main(){
 const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();
 if(!email||!/^\S+@\S+\.\S+$/.test(email))throw new Error("Set ADMIN_EMAIL.");
 if(process.argv.includes("--reset")){
  const user=await prisma.user.findUnique({where:{email}});if(!user)throw new Error("Account does not exist.");
  // Recovery requires operator access to the database host.
  await prisma.user.update({where:{id:user.id},data:{active:true,sessionVersion:{increment:1}}});
  const token=await issueReset(user.id);
  console.log(new URL("/admin/reset#"+token,process.env.AUTH_URL||process.env.NEXTAUTH_URL||"http://localhost:3000").toString());return;
 }
 const password=process.env.ADMIN_PASSWORD,name=process.env.ADMIN_NAME||"Administrator";
 if(!password||password.length<12||Buffer.byteLength(password)>72)throw new Error("Set ADMIN_PASSWORD to a unique password of 12–72 bytes.");
 if(await prisma.user.findUnique({where:{email}}))throw new Error("Account already exists. Use admin:reset to recover access.");
 await prisma.user.create({data:{email,name,passwordHash:await hash(password,12),role:"SUPER_ADMIN",active:true}});
 console.log("Super Admin created. Sign in at /admin.");
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
