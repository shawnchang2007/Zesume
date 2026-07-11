import { describe, expect, it } from "vitest";

import {
  canGenerate,
  canUseFeature,
  type CurrentAccess,
} from "@/lib/billing/access";
import { canPlanUseFeature, PLAN_LIMITS } from "@/lib/billing/plan-config";

function access(overrides: Partial<CurrentAccess> = {}): CurrentAccess {
  return {
    authenticated: true,
    userId: "test-user",
    plan: "FREE",
    limits: PLAN_LIMITS.FREE,
    usage: {
      used: 0,
      limit: PLAN_LIMITS.FREE.generationLimit,
      remaining: PLAN_LIMITS.FREE.generationLimit,
      periodStart: null,
      periodEnd: null,
    },
    entitlements: { customTemplatePasses: 0 },
    cancelAtPeriodEnd: false,
    databaseBacked: true,
    ...overrides,
  };
}

describe("access controls", () => {
  it("blocks generation when no quota remains", () => {
    expect(canGenerate(access({ usage: { ...access().usage, remaining: 0 } }))).toBe(false);
  });

  it("allows a template pass to unlock custom templates", () => {
    expect(
      canUseFeature(
        access({ entitlements: { customTemplatePasses: 1 } }),
        "CUSTOM_TEMPLATE",
      ),
    ).toBe(true);
  });

  it("keeps custom templates gated by plan", () => {
    expect(canPlanUseFeature("FREE", "CUSTOM_TEMPLATE")).toBe(false);
    expect(canPlanUseFeature("PLUS", "CUSTOM_TEMPLATE")).toBe(true);
    expect(canPlanUseFeature("PRO", "CUSTOM_TEMPLATE")).toBe(true);
  });
});
