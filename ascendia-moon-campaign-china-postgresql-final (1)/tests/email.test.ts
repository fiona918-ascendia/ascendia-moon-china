import { afterEach, describe, expect, it, vi } from "vitest";
import { sendLeadNotification } from "@/lib/email";
import type { ValidatedLeadPayload } from "@/lib/validation";
import { createMoonReport } from "@/lib/reporting";

const send = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  }
}));

const payload: ValidatedLeadPayload = {
  requestId: "a3e1b8cf-2a91-4dfc-a9a2-28c746a5bc20",
  startedAt: Date.now() - 5000,
  answers: {
    markets: ["hong_kong"],
    businessStage: "planning",
    serviceNeeds: ["entity_structure"],
    completedItems: [],
    painPoints: ["structure"],
    timeline: "one_month"
  },
  contact: {
    name: "张三",
    company: "示例公司",
    contactType: "wechat",
    contactValue: "example_wechat",
    consent: true,
    website: ""
  }
};

const report = createMoonReport(payload.answers, true);
const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  send.mockReset();
});

describe("Resend lead notification", () => {
  it("stays pending when email delivery is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;

    await expect(sendLeadNotification(payload, report)).resolves.toEqual({ status: "pending" });
    expect(send).not.toHaveBeenCalled();
  });

  it("records a returned provider error as failed", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Campaign <leads@example.com>";
    send.mockResolvedValue({ error: { message: "provider unavailable" } });

    await expect(sendLeadNotification(payload, report)).resolves.toEqual({ status: "failed" });
  });

  it("records a successful provider response as sent", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Campaign <leads@example.com>";
    send.mockResolvedValue({ data: { id: "email-id" } });

    await expect(sendLeadNotification(payload, report)).resolves.toEqual({ status: "sent" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "fiona.gu@ascendiaptrs.com" }));
  });
});
