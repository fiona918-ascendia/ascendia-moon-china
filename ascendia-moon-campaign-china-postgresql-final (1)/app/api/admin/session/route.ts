import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "未登录或无权限。" }, { status: 401 });
  return NextResponse.json({ email: admin.email });
}
