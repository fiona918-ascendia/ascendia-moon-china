import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { sendLeadNotification } from "@/lib/email";
import { campaignIsEnabled } from "@/lib/campaign-status";
import { createMoonReport } from "@/lib/reporting";
import { allowRequest, getRequestFingerprint } from "@/lib/rate-limit";
import { insertLead, updateLeadByRequestId } from "@/lib/lead-store";
import { validateLeadPayload } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!campaignIsEnabled()) {
    return NextResponse.json({ error: "本期活动已结束。" }, { status: 410 });
  }
  const fingerprint = getRequestFingerprint(request.headers);
  if (!allowRequest("lead:" + fingerprint)) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试。" }, { status: 429 });
  }

  try {
    const payload = validateLeadPayload(await request.json());
    const report = createMoonReport(payload.answers, true);
    const result = await insertLead({
      request_id: payload.requestId,
      name: payload.contact.name,
      company: payload.contact.company,
      contact_type: payload.contact.contactType,
      contact_value: payload.contact.contactValue,
      email: payload.contact.email ?? null,
      markets: payload.answers.markets,
      business_stage: payload.answers.businessStage,
      service_needs: payload.answers.serviceNeeds,
      completed_items: payload.answers.completedItems,
      pain_points: payload.answers.painPoints,
      timeline: payload.answers.timeline,
      moon_phase: report.phase.id,
      completion_count: report.completionCount,
      lead_priority: report.highIntent ? "high" : "normal",
      sales_status: "new",
      email_notification_status: "pending",
      consent_at: new Date().toISOString()
    });

    if (result.error) {
      return NextResponse.json({ error: "系统暂时无法保存，请稍后重试。" }, { status: 503 });
    }

    if (!result.duplicate) {
      const emailResult = await sendLeadNotification(payload, report);
      await updateLeadByRequestId(payload.requestId, { email_notification_status: emailResult.status });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "请检查填写信息。" }, { status: 400 });
    }
    if (error instanceof Error) {
      const safeMessages = [
        "提交时间异常，请重新完成测试。",
        "请填写有效的手机号码。",
        "请填写有效的微信号。",
        "请填写有效的邮箱地址。",
        "请完成所有必答题。",
        "超过本题可选择的最大数量。",
        "排他选项不能与其他选项同时选择。",
        "提交未通过验证。"
      ];
      if (safeMessages.includes(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "提交未成功，请稍后再试。" }, { status: 400 });
  }
}
