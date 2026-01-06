import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body.username || "");
  const password = String(body.password || "");
  const envUser = process.env.ADMIN_USERNAME || "";
  const envHash = process.env.ADMIN_PASSWORD_HASH || "";
  const secret = process.env.APP_SECRET || "";
  if (!envUser || !envHash || !secret) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }
  if (username !== envUser) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await verifyPassword(password, envHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = signToken({ sub: envUser, role: "admin" }, secret, 60 * 60 * 12);
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

