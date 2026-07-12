import type { CurrentUser } from "@/lib/auth/current-user";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import {
  canPlanUseFeature,
  PLAN_LIMITS,
  type AccessPlan,
  type GatedFeature,
} from "./plan-config";

export type CurrentAccess = {
  authenticated: boolean;
  userId: string | null;
  plan: AccessPlan;
  limits: (typeof PLAN_LIMITS)[AccessPlan];
  usage: {
    used: number;
    limit: number;
    remaining: number;
    periodStart: string | null;
    periodEnd: string | null;
  };
  entitlements: {
    customTemplatePasses: number;
  };
  cancelAtPeriodEnd: boolean;
  databaseBacked: boolean;
};

function freePeriod(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

function buildAccess(options: {
  authenticated: boolean;
  userId?: string | null;
  plan: AccessPlan;
  used?: number;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  customTemplatePasses?: number;
  cancelAtPeriodEnd?: boolean;
  databaseBacked?: boolean;
}): CurrentAccess {
  const limits = PLAN_LIMITS[options.plan];
  const used = Math.max(0, options.used ?? 0);

  return {
    authenticated: options.authenticated,
    userId: options.userId ?? null,
    plan: options.plan,
    limits,
    usage: {
      used,
      limit: limits.generationLimit,
      remaining: Math.max(0, limits.generationLimit - used),
      periodStart: options.periodStart?.toISOString() ?? null,
      periodEnd: options.periodEnd?.toISOString() ?? null,
    },
    entitlements: {
      customTemplatePasses: Math.max(0, options.customTemplatePasses ?? 0),
    },
    cancelAtPeriodEnd: options.cancelAtPeriodEnd ?? false,
    databaseBacked: options.databaseBacked ?? false,
  };
}

export function guestAccess() {
  return buildAccess({ authenticated: false, plan: "GUEST" });
}

export function freeAccess(userId?: string | null) {
  const period = freePeriod();
  return buildAccess({
    authenticated: true,
    userId,
    plan: "FREE",
    periodStart: period.start,
    periodEnd: period.end,
  });
}

export async function getCurrentAccess(
  currentUser: CurrentUser | null,
): Promise<CurrentAccess> {
  if (!currentUser) return guestAccess();
  if (!currentUser.id || !isDatabaseConfigured()) return freeAccess(currentUser.id);

  const now = new Date();

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: currentUser.id,
        status: { in: ["ACTIVE", "TRIALING"] },
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
      },
      orderBy: [{ plan: "desc" }, { updatedAt: "desc" }],
    });
    const period = subscription?.currentPeriodStart && subscription.currentPeriodEnd
      ? {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd,
        }
      : freePeriod(now);
    const plan: AccessPlan = subscription?.plan ?? "FREE";
    const [used, passAggregate] = await Promise.all([
      prisma.usageEvent.count({
        where: {
          userId: currentUser.id,
          type: "RESUME_GENERATION",
          createdAt: { gte: period.start, lt: period.end },
        },
      }),
      prisma.entitlement.aggregate({
        where: {
          userId: currentUser.id,
          type: "CUSTOM_TEMPLATE_PASS",
          status: "ACTIVE",
          remainingQuantity: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        _sum: { remainingQuantity: true },
      }),
    ]);

    return buildAccess({
      authenticated: true,
      userId: currentUser.id,
      plan,
      used,
      periodStart: period.start,
      periodEnd: period.end,
      customTemplatePasses: passAggregate._sum.remainingQuantity ?? 0,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
      databaseBacked: true,
    });
  } catch {
    return freeAccess(currentUser.id);
  }
}

export function canUseFeature(access: CurrentAccess, feature: GatedFeature) {
  return canPlanUseFeature(access.plan, feature);
}

export function canGenerate(access: CurrentAccess) {
  return access.usage.remaining > 0;
}

export function getRemainingGenerations(access: CurrentAccess) {
  return access.usage.remaining;
}
