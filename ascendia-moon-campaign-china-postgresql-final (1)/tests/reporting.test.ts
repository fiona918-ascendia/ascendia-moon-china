import { describe, expect, it } from "vitest";
import { createMoonReport, getMoonPhase } from "@/lib/reporting";

const baseAnswers = {
  markets: ["malaysia"],
  businessStage: "planning",
  serviceNeeds: ["tax_compliance", "work_permits"],
  completedItems: [] as string[],
  painPoints: ["tax"],
  timeline: "one_month"
};

describe("moon thresholds", () => {
  it.each([
    [0, "新月期"],
    [1, "新月期"],
    [2, "上弦月"],
    [3, "上弦月"],
    [4, "盈月期"],
    [5, "盈月期"],
    [6, "满月期"]
  ])("maps %i completed items to %s", (count, phaseName) => {
    expect(getMoonPhase(count).name).toBe(phaseName);
  });
});

describe("report recommendations", () => {
  it("prioritises unfinished selected services and applies the high-intent rule", () => {
    const report = createMoonReport(baseAnswers, true);
    expect(report.completionCount).toBe(0);
    expect(report.serviceRecommendations).toContain("财税合规 / 记账报税 / 审计协调");
    expect(report.highIntent).toBe(true);
  });

  it("does not mark an incomplete contact record high intent", () => {
    expect(createMoonReport(baseAnswers, false).highIntent).toBe(false);
  });
});
