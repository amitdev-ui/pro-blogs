import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const allowPaths = ["/admin/login", "/api/auth/login", "/api/auth/logout"];
  if (allowPaths.includes(pathname)) return NextResponse.next();
  const protect = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!protect) return NextResponse.next();
  const token = request.cookies.get("admin_session")?.value || "";
  const secret = process.env.APP_SECRET || "";
  const valid = token && secret ? await verifyToken(token, secret) : null;
  if (!valid) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"],
};
