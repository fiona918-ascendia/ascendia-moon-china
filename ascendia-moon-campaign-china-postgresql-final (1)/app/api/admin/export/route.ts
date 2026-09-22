import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getChoiceLabel } from "@/lib/campaign-config";
import { csvEscape } from "@/lib/lead-formatting";
import { listLeads } from "@/lib/lead-store";

const headers = ["姓名", "公司名称", "联系方式类型", "联系方式", "邮箱", "意向国家", "当前出海阶段", "需要的服务", "已完成海外布局", "当前痛点", "预计推进时间", "月相结果", "完成度", "Lead 优先级", "销售状态", "邮件通知状态", "提交时间"];

function labels(question: Parameters<typeof getChoiceLabel>[0], values: string[] | string) {
  const list = Array.isArray(values) ? values : [values];
  return list.map((value) => getChoiceLabel(question, value)).join("、");
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "未登录或无权限。" }, { status: 401 });
  let data;
  try { data = await listLeads(5000); } catch { return NextResponse.json({ error: "无法导出线索。" }, { status: 503 }); }
  const rows = (data ?? []).map((lead) => [
    lead.name,
    lead.company,
    lead.contact_type === "phone" ? "手机号码" : "微信号",
    lead.contact_value,
    lead.email ?? "",
    labels("markets", lead.markets),
    getChoiceLabel("businessStage", lead.business_stage),
    labels("serviceNeeds", lead.service_needs),
    labels("completedItems", lead.completed_items),
    labels("painPoints", lead.pain_points),
    getChoiceLabel("timeline", lead.timeline),
    lead.moon_phase,
    lead.completion_count + "/6",
    lead.lead_priority,
    lead.sales_status,
    lead.email_notification_status,
    lead.created_at
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ascendia-moon-leads.csv",
      "Cache-Control": "no-store"
    }
  });
}
