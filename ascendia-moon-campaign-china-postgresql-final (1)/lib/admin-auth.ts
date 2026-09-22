import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { useCloudBase } from "@/lib/cloudbase-admin";
import { getSupabaseAdmin, getSupabaseAuthClient } from "@/lib/supabase-admin";

const ACCESS_COOKIE = "ascendia_admin_access";
const REFRESH_COOKIE = "ascendia_admin_refresh";
const CN_COOKIE = "ascendia_cn_admin";

export type AdminUser = { id: string; email: string };

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  if (useCloudBase()) {
    const token = cookieStore.get(CN_COOKIE)?.value;
    if (!token) return null;
    const [payload, signature] = token.split(".");
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!payload || !signature || !secret) return null;
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try {
      const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email: string; exp: number };
      if (session.exp < Date.now() || session.email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) return null;
      return { id: "cloudbase-admin", email: session.email };
    } catch { return null; }
  }
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const auth = getSupabaseAuthClient();
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user?.email) return null;
    const { data: record, error: recordError } = await getSupabaseAdmin()
      .from("admin_users")
      .select("user_id, is_active")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (recordError) return null;
    if (record?.is_active) return { id: data.user.id, email: data.user.email };

    const bootstrapEmails = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    return bootstrapEmails.includes(data.user.email.toLowerCase()) ? { id: data.user.id, email: data.user.email } : null;
  } catch {
    return null;
  }
}

export function applyCloudBaseAdminCookie(response: NextResponse, email: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET missing");
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  response.cookies.set(CN_COOKIE, `${payload}.${signature}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 12 * 60 * 60 });
}

export function applyAdminCookies(response: NextResponse, accessToken: string, refreshToken: string, expiresIn: number) {
  const secure = process.env.NODE_ENV === "production";
  const options = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: expiresIn };
  response.cookies.set(ACCESS_COOKIE, accessToken, options);
  response.cookies.set(REFRESH_COOKIE, refreshToken, { ...options, maxAge: 60 * 60 * 24 * 14 });
}

export function clearAdminCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(CN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
