import { z } from "zod";
import { QuestionConfig, getQuestion } from "@/lib/campaign-config";
import type { CampaignAnswers } from "@/lib/reporting";

const text = (maximum: number) =>
  z.string().trim().min(1, "该字段不能为空。").max(maximum, "填写内容过长。").transform(cleanText);

function cleanText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

const rawAnswersSchema = z.object({
  markets: z.array(z.string()),
  businessStage: z.string(),
  serviceNeeds: z.array(z.string()),
  completedItems: z.array(z.string()),
  painPoints: z.array(z.string()),
  timeline: z.string()
});

const rawPayloadSchema = z.object({
  requestId: z.string().uuid("请求标识无效。"),
  startedAt: z.number().int().positive(),
  answers: rawAnswersSchema,
  contact: z.object({
    name: text(80),
    company: text(120),
    contactType: z.enum(["wechat", "phone"]),
    contactValue: text(40),
    email: z.string().trim().max(160).optional().transform((value) => value ? cleanText(value) : undefined),
    consent: z.literal(true, { errorMap: () => ({ message: "请先同意信息使用说明。" }) }),
    website: z.string().max(0, "提交未通过验证。")
  })
});

export type ValidatedLeadPayload = Omit<z.output<typeof rawPayloadSchema>, "answers"> & {
  answers: CampaignAnswers;
};

function validateChoiceSet(questionId: QuestionConfig["id"], values: string[]) {
  const question = getQuestion(questionId);
  const deduplicated = [...new Set(values)];
  const validIds = new Set(question.choices.map((choice) => choice.id));
  if (deduplicated.some((value) => !validIds.has(value))) throw new Error("提交中包含无效选项。");
  if (question.kind === "single" && deduplicated.length !== 1) throw new Error("单选题只能选择一项。");
  if (question.maxSelections && deduplicated.length > question.maxSelections) throw new Error("超过本题可选择的最大数量。");
  if (deduplicated.length < (question.minimumSelections ?? 0)) throw new Error("请完成所有必答题。");
  if (deduplicated.length > 1 && deduplicated.some((id) => question.choices.find((choice) => choice.id === id)?.exclusive)) {
    throw new Error("排他选项不能与其他选项同时选择。");
  }
  return deduplicated;
}

function validateAnswers(answers: z.output<typeof rawAnswersSchema>): CampaignAnswers {
  const markets = validateChoiceSet("markets", answers.markets);
  const stages = validateChoiceSet("businessStage", answers.businessStage ? [answers.businessStage] : []);
  const serviceNeeds = validateChoiceSet("serviceNeeds", answers.serviceNeeds);
  const completedItems = validateChoiceSet("completedItems", answers.completedItems);
  const painPoints = validateChoiceSet("painPoints", answers.painPoints);
  const timelines = validateChoiceSet("timeline", answers.timeline ? [answers.timeline] : []);
  return {
    markets,
    businessStage: stages[0],
    serviceNeeds,
    completedItems,
    painPoints,
    timeline: timelines[0]
  };
}

function validateContact(contact: z.output<typeof rawPayloadSchema>["contact"]) {
  if (contact.contactType === "phone" && !/^\+?[0-9][0-9\-\s]{6,18}$/.test(contact.contactValue)) {
    throw new Error("请填写有效的手机号码。");
  }
  if (contact.contactType === "wechat" && !/^[A-Za-z][A-Za-z0-9_-]{4,39}$/.test(contact.contactValue)) {
    throw new Error("请填写有效的微信号。");
  }
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    throw new Error("请填写有效的邮箱地址。");
  }
  return contact;
}

export function validateLeadPayload(input: unknown): ValidatedLeadPayload {
  const parsed = rawPayloadSchema.parse(input);
  const elapsed = Date.now() - parsed.startedAt;
  if (elapsed < 2500 || elapsed > 1000 * 60 * 60 * 6) throw new Error("提交时间异常，请重新完成测试。");
  return {
    ...parsed,
    answers: validateAnswers(parsed.answers),
    contact: validateContact(parsed.contact)
  };
}
