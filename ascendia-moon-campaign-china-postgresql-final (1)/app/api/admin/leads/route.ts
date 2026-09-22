import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { listLeads } from "@/lib/lead-store";

function textFilter(value: string | null) {
  return (value ?? "").replace(/[,%()]/g, "").trim().slice(0, 80);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "未登录或无权限。" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = textFilter(searchParams.get("search"));
  const market = textFilter(searchParams.get("market"));
  const service = textFilter(searchParams.get("service"));
  const phase = textFilter(searchParams.get("phase"));
  const timeline = textFilter(searchParams.get("timeline"));
  const status = textFilter(searchParams.get("status"));

  try {
    const needle = search.toLowerCase();
    const data = (await listLeads(200)).filter((lead) =>
      (!needle || [lead.name, lead.company, lead.contact_value].some((value) => String(value ?? "").toLowerCase().includes(needle))) &&
      (!market || (lead.markets as string[] | undefined)?.includes(market)) &&
      (!service || (lead.service_needs as string[] | undefined)?.includes(service)) &&
      (!phase || lead.moon_phase === phase) && (!timeline || lead.timeline === timeline) && (!status || lead.sales_status === status)
    );
    return NextResponse.json({ leads: data, total: data.length });
  } catch { return NextResponse.json({ error: "无法读取线索列表。" }, { status: 503 }); }
}
