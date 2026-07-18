import { afterEach, describe, expect, it, vi } from "vitest";
import {
  sanitizeAnalyticsParameters,
  trackEvent,
} from "@/lib/analytics/client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analytics parameter safety", () => {
  it("drops empty values and limits long strings", () => {
    const result = sanitizeAnalyticsParameters({
      plan: "PRO",
      email: "student@example.com",
      resume_text: "private resume content",
      error_code: undefined,
      optional: null,
      long_value: "x".repeat(140),
    });

    expect(result).toEqual({
      plan: "PRO",
      long_value: "x".repeat(100),
    });
  });

  it("keeps GA ecommerce items while cleaning their strings", () => {
    const result = sanitizeAnalyticsParameters({
      currency: "USD",
      value: 10,
      items: [
        {
          item_id: "pro",
          item_name: "  Zesume Pro  ",
          price: 10,
          quantity: 1,
        },
      ],
    });

    expect(result).toEqual({
      currency: "USD",
      value: 10,
      items: [
        {
          item_id: "pro",
          item_name: "Zesume Pro",
          price: 10,
          quantity: 1,
        },
      ],
    });
  });

  it("queues events for gtag without including blocked personal data", () => {
    vi.stubGlobal("window", {});

    trackEvent("resume_generation_succeeded", {
      plan: "PRO",
      duration_ms: 1200,
      email: "student@example.com",
      resume_text: "private resume content",
    });

    expect(window.dataLayer).toEqual([
      [
        "event",
        "resume_generation_succeeded",
        { plan: "PRO", duration_ms: 1200 },
      ],
    ]);
  });
});
