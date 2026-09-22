import { getChoiceLabel } from "@/lib/campaign-config";
import type { CampaignAnswers } from "@/lib/reporting";

export function joinLabels(question: keyof CampaignAnswers, values: string[] | string) {
  const questionId = question as Parameters<typeof getChoiceLabel>[0];
  const choiceValues = Array.isArray(values) ? values : [values];
  return choiceValues.map((value) => getChoiceLabel(questionId, value)).join("、");
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
}
