import {
  COMPLETION_SERVICE_MAP,
  HIGH_INTENT_TIMELINES,
  MOON_PHASES,
  PAIN_POINT_SERVICE_MAP,
  getChoiceLabel
} from "@/lib/campaign-config";

export type CampaignAnswers = {
  markets: string[];
  businessStage: string;
  serviceNeeds: string[];
  completedItems: string[];
  painPoints: string[];
  timeline: string;
};

export type MoonReport = {
  phase: (typeof MOON_PHASES)[number];
  completionCount: number;
  completedLabels: string[];
  remainingLabels: string[];
  serviceRecommendations: string[];
  highIntent: boolean;
};

export function getMoonPhase(completionCount: number) {
  return MOON_PHASES.find((phase) => completionCount >= phase.min && completionCount <= phase.max) ?? MOON_PHASES[0];
}

export function createMoonReport(answers: CampaignAnswers, contactComplete = false): MoonReport {
  const completionCount = answers.completedItems.length;
  const phase = getMoonPhase(completionCount);
  const completedLabels = answers.completedItems.map((id) => getChoiceLabel("completedItems", id));
  const remainingLabels = ["entity", "market_access", "tax", "funds", "people", "maintenance"]
    .filter((id) => !answers.completedItems.includes(id))
    .map((id) => getChoiceLabel("completedItems", id));

  const ranked = new Map<string, number>();
  const addScore = (id: string, score: number) => ranked.set(id, (ranked.get(id) ?? 0) + score);

  answers.serviceNeeds.forEach((serviceId) => {
    const linkedCompletionItems = COMPLETION_SERVICE_MAP[serviceId] ?? [];
    const isUnfinished = linkedCompletionItems.some((item) => !answers.completedItems.includes(item));
    addScore(serviceId, isUnfinished ? 5 : 2);
  });

  answers.painPoints.forEach((painPointId) => {
    (PAIN_POINT_SERVICE_MAP[painPointId] ?? []).forEach((serviceId) => {
      const linkedCompletionItems = COMPLETION_SERVICE_MAP[serviceId] ?? [];
      const isUnfinished = linkedCompletionItems.some((item) => !answers.completedItems.includes(item));
      addScore(serviceId, isUnfinished ? 4 : 1);
    });
  });

  if (ranked.size === 0) addScore("overall_assessment", 1);
  const serviceRecommendations = [...ranked.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => getChoiceLabel("serviceNeeds", id));

  return {
    phase,
    completionCount,
    completedLabels,
    remainingLabels,
    serviceRecommendations,
    highIntent:
      contactComplete &&
      HIGH_INTENT_TIMELINES.includes(answers.timeline as (typeof HIGH_INTENT_TIMELINES)[number]) &&
      answers.serviceNeeds.some((id) => id !== "overall_assessment")
  };
}
