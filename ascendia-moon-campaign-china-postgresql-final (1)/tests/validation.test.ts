import { describe, expect, it } from "vitest";
import { validateLeadPayload } from "@/lib/validation";

const validPayload = {
  requestId: "018f3ef1-3a97-7b5b-9f75-2882f4dfd9d4",
  startedAt: Date.now() - 5000,
  answers: {
    markets: ["malaysia"],
    businessStage: "planning",
    serviceNeeds: ["tax_compliance"],
    completedItems: [],
    painPoints: ["tax"],
    timeline: "one_month"
  },
  contact: {
    name: "Fiona",
    company: "Ascendia",
    contactType: "wechat",
    contactValue: "fiona_gu",
    email: "",
    consent: true,
    website: ""
  }
};

describe("server lead validation", () => {
  it("accepts a valid lead without retaining the optional empty email", () => {
    const result = validateLeadPayload(validPayload);
    expect(result.contact.email).toBeUndefined();
  });

  it("rejects more than three target markets", () => {
    expect(() => validateLeadPayload({ ...validPayload, answers: { ...validPayload.answers, markets: ["malaysia", "singapore", "thailand", "vietnam"] } })).toThrow();
  });

  it("rejects the exclusive undecided market mixed with a country", () => {
    expect(() => validateLeadPayload({ ...validPayload, answers: { ...validPayload.answers, markets: ["malaysia", "undetermined"] } })).toThrow();
  });

  it("rejects more than two pain points", () => {
    expect(() => validateLeadPayload({ ...validPayload, answers: { ...validPayload.answers, painPoints: ["tax", "funds", "people"] } })).toThrow();
  });

  it("rejects a filled honeypot", () => {
    expect(() => validateLeadPayload({ ...validPayload, contact: { ...validPayload.contact, website: "spam" } })).toThrow();
  });
});
