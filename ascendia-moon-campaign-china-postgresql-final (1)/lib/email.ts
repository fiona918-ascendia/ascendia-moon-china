import { Resend } from "resend";
import { BRAND, getChoiceLabel } from "@/lib/campaign-config";
import type { ValidatedLeadPayload } from "@/lib/validation";
import type { MoonReport } from "@/lib/reporting";

function escapeHtml(value: string) {
  return value.replace(/&/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] ?? character);
}

function labels(question: Parameters<typeof getChoiceLabel>[0], values: string[] | string) {
  const list = Array.isArray(values) ? values : [values];
  return list.map((value) => getChoiceLabel(question, value)).join("、");
}

export async function sendLeadNotification(payload: ValidatedLeadPayload, report: MoonReport) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { status: "pending" as const };

  const timeline = getChoiceLabel("timeline", payload.answers.timeline);
  const markets = labels("markets", payload.answers.markets);
  const services = labels("serviceNeeds", payload.answers.serviceNeeds);
  const subjectPrefix = report.highIntent ? "🔥【高意向客户】" : "【新客户线索】";
  const subject = subjectPrefix + markets + "｜" + services + "｜" + timeline;
  const fields = [
    ["姓名", payload.contact.name],
    ["公司", payload.contact.company],
    [payload.contact.contactType === "phone" ? "手机号码" : "微信号", payload.contact.contactValue],
    ["邮箱", payload.contact.email ?? "未提供"],
    ["意向市场", markets],
    ["当前阶段", getChoiceLabel("businessStage", payload.answers.businessStage)],
    ["服务需求", services],
    ["已点亮布局", labels("completedItems", payload.answers.completedItems)],
    ["月相", report.phase.name + "（" + report.completionCount + "/6）"],
    ["最大卡点", labels("painPoints", payload.answers.painPoints)],
    ["预计推进时间", timeline],
    ["Lead 优先级", report.highIntent ? "🔥 高意向" : "普通"]
  ];

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: process.env.LEAD_NOTIFY_EMAIL ?? BRAND.notifyEmail,
      subject,
      html: "<h2>企业出海月相测试新线索</h2><table>" + fields.map(([label, value]) => "<tr><td style='padding:6px 10px;color:#62717a'>" + escapeHtml(label) + "</td><td style='padding:6px 10px'>" + escapeHtml(value) + "</td></tr>").join("") + "</table>"
    });
    return { status: error ? "failed" as const : "sent" as const };
  } catch {
    return { status: "failed" as const };
  }
}
