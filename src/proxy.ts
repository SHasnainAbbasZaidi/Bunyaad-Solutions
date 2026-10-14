import { NextRequest,NextResponse } from "next/server";
import { currentUser } from "@/lib/auth-utils";
export async function proxy(request:NextRequest){
 if(["/admin/login","/admin/reset"].includes(request.nextUrl.pathname))return NextResponse.next();
 if(!await currentUser())return NextResponse.redirect(new URL("/admin/login",request.url));
 return NextResponse.next();
}
export const config={matcher:["/admin/:path*"]};
