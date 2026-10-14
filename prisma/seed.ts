import {PrismaClient} from "@prisma/client";
import {stat} from "node:fs/promises";
const prisma=new PrismaClient();
async function main(){
 if(!await prisma.heroSection.count())await prisma.heroSection.create({data:{headline:"Building the Foundation of Digital Innovation.",description:"We design, develop, and power digital platforms that connect businesses, empower consumers, and transform industries.",subtitle:"B2B · B2C · D2C",published:true}});
 const sections=[
 ["overview","About Bunyaad Solutions","Bunyaad Solutions is an emerging technology company focused on creating scalable digital platforms and innovative technology solutions for businesses and consumers."],
 ["mission","Our mission","To simplify business challenges through reliable, innovative, and accessible digital technology."],
 ["vision","Our vision","To become a trusted technology company building platforms that create opportunities for businesses and communities."],
 ["approach","Our approach","Research business needs. Design clear experiences. Develop reliable platforms. Launch thoughtfully. Improve through feedback."],
 ["story","Company story",""],["values","Core values",""],["expertise","Areas of expertise",""],["philosophy","Business philosophy",""],["objectives","Long-term objectives",""]];
 for(const [sortOrder,[sectionKey,title,content]]of sections.entries())await prisma.aboutSection.upsert({where:{sectionKey},update:{},create:{sectionKey,title,content:"<p>"+content+"</p>",visible:!!content,sortOrder}});
 const services=[
 ["B2B Platform Development","Business platforms connecting businesses with other businesses."],
 ["B2C Platform Development","Digital platforms connecting businesses directly with consumers."],
 ["D2C Platform Development","Platforms enabling direct relationships between brands and their customers."],
 ["E-Commerce Solutions","E-commerce platforms and multi-vendor marketplaces."],
 ["Property Technology Solutions","Digital solutions for property discovery and real estate operations."],
 ["Event Management Platforms","Event organizing and booking platforms."],
 ["SaaS & Enterprise Applications","Cloud applications and business management software."],
 ["Custom Software Development","Web applications and custom enterprise software."],
 ["Business Automation","Digital tools that simplify business operations."]];
 // Existing service content remains untouched.
 for(const [sortOrder,[title,summary]]of services.entries()){
  const slug=["b2b-platforms","b2c-platforms","d2c-commerce","multi-vendor-marketplaces","real-estate-platforms","event-booking-platforms","saas-automation","custom-web-apps","business-automation"][sortOrder];
  if(!await prisma.service.findFirst({where:{title}}))await prisma.service.upsert({where:{slug},update:{},create:{title,slug,shortDescription:summary,fullContent:"<p>"+summary+"</p>",sortOrder,published:true,icon:"Layers"}});
 }
 await prisma.project.upsert({where:{slug:"tekchowk"},update:{},create:{name:"TekChowk",slug:"tekchowk",description:"An e-commerce marketplace initiative.",status:"PLANNING",businessModel:"HYBRID",industry:"E-commerce",published:false}});
 const settings=[
 ["site_name","Bunyaad Solutions","general"],["site_tagline","Building the Foundation of Digital Innovation.","general"],["contact_email","","contact"],["contact_phone","","contact"],["contact_address","","contact"],["linkedin_url","","social"],["twitter_url","","social"],
 ["footer_content","Building the Foundation of Digital Innovation.","footer"],["seo_title","Bunyaad Solutions — Digital Platforms & Technology","seo"],["seo_description","Technology platforms and solutions for businesses and consumers.","seo"],["theme_default","dark","general"],
 ["homepage_sections",JSON.stringify({hero:true,about:true,services:true,projects:true,approach:true,team:true,news:true,contact:true}),"general"],
 ["navigation",JSON.stringify([{name:"Solutions",href:"/solutions"},{name:"Platforms",href:"/projects"},{name:"About",href:"/about"},{name:"Team",href:"/team"},{name:"News",href:"/news"},{name:"Contact",href:"/contact"}]),"navigation"],
 ["section_copy",JSON.stringify({services_title:"Our solutions",services_description:"Technology solutions for businesses and consumers.",projects_title:"Our digital platforms",projects_description:"Explore our planned and active initiatives.",team_title:"Founders & team",team_description:"Verified team profiles will be shared here.",news_title:"News & insights",news_description:"Company announcements and technology insights."}),"general"]];
 for(const [key,value,group]of settings)await prisma.siteSettings.upsert({where:{key},update:{},create:{key,value,group}});
 for(const filename of ["logo-dark.png","logo-light.png","icon-dark.png","icon-light.png"]){
  const url="/brand/"+filename;
  if(!await prisma.media.findFirst({where:{url}}))await prisma.media.create({data:{filename,originalName:filename,mimeType:"image/png",size:(await stat("public"+url)).size,url,isProtected:true,alt:"Bunyaad Solutions brand asset"}});
 }
 console.log("Default content added. Existing content and accounts were not overwritten.");
}
main().finally(()=>prisma.$disconnect());
