import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getLead, updateLeadStatus } from "@/lib/lead-store";

const idSchema = z.string().min(1).max(128);
const statusSchema = z.object({
  salesStatus: z.enum(["new", "contacted", "following_up", "quoted", "won", "paused"])
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "未登录或无权限。" }, { status: 401 });
  try {
    const { id } = await params;
    const validId = idSchema.parse(id);
    const data = await getLead(validId);
    if (!data) return NextResponse.json({ error: "未找到该线索。" }, { status: 404 });
    return NextResponse.json({ lead: data });
  } catch {
    return NextResponse.json({ error: "线索标识无效。" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "未登录或无权限。" }, { status: 401 });
  try {
    const { id } = await params;
    const validId = idSchema.parse(id);
    const { salesStatus } = statusSchema.parse(await request.json());
    const data = await updateLeadStatus(validId, salesStatus);
    return NextResponse.json({ lead: data });
  } catch {
    return NextResponse.json({ error: "销售状态无效。" }, { status: 400 });
  }
}
