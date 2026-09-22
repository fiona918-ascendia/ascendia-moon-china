import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { applyAdminCookies, applyCloudBaseAdminCookie } from "@/lib/admin-auth";
import { useCloudBase } from "@/lib/cloudbase-admin";
import { getSupabaseAdmin, getSupabaseAuthClient } from "@/lib/supabase-admin";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(160)
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = schema.parse(await request.json());
    if (useCloudBase()) {
      const expectedEmail = process.env.ADMIN_EMAIL ?? "";
      const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
      const emailOk = email.toLowerCase() === expectedEmail.toLowerCase();
      const supplied = Buffer.from(password);
      const expected = Buffer.from(expectedPassword);
      const passwordOk = supplied.length === expected.length && timingSafeEqual(supplied, expected);
      if (!emailOk || !passwordOk) return NextResponse.json({ error: "邮箱或密码不正确。" }, { status: 401 });
      const response = NextResponse.json({ ok: true });
      applyCloudBaseAdminCookie(response, email);
      return response;
    }
    const auth = getSupabaseAuthClient();
    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: "邮箱或密码不正确。" }, { status: 401 });
    }

    const { data: adminRecord } = await getSupabaseAdmin()
      .from("admin_users")
      .select("is_active")
      .eq("user_id", data.user.id)
      .maybeSingle();
    const bootstrapEmails = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    const isAllowed = adminRecord?.is_active || (data.user.email && bootstrapEmails.includes(data.user.email.toLowerCase()));
    if (!isAllowed) {
      await auth.auth.signOut({ scope: "local" });
      return NextResponse.json({ error: "该账号尚未获授权访问后台。" }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true });
    applyAdminCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in);
    return response;
  } catch {
    return NextResponse.json({ error: "请填写有效的登录信息。" }, { status: 400 });
  }
}
