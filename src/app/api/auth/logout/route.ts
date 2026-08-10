import { NextResponse } from "next/server";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await logActivity(user.sub, "LOGOUT", `${user.name} logout dari sistem`);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
