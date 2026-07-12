export type AccessPlan = "GUEST" | "FREE" | "PLUS" | "PRO";

export type GatedFeature =
  | "BASIC_PROFILE"
  | "CUSTOM_TEMPLATE"
  | "CAREER_EXPERIENCE"
  | "PROFILE_IMPORT"
  | "PROFILE_GENERATION";

export const PLAN_LIMITS = {
  GUEST: {
    generationLimit: 1,
    generationWindow: "24_HOURS",
    historyLimit: 0,
    customTemplates: false,
    careerExperience: false,
    profileImport: false,
    profileGeneration: false,
  },
  FREE: {
    generationLimit: 3,
    generationWindow: "BILLING_PERIOD",
    historyLimit: 3,
    customTemplates: false,
    careerExperience: false,
    profileImport: false,
    profileGeneration: false,
  },
  PLUS: {
    generationLimit: 50,
    generationWindow: "BILLING_PERIOD",
    historyLimit: 10,
    customTemplates: true,
    careerExperience: false,
    profileImport: false,
    profileGeneration: false,
  },
  PRO: {
    generationLimit: 100,
    generationWindow: "BILLING_PERIOD",
    historyLimit: 20,
    customTemplates: true,
    careerExperience: true,
    profileImport: true,
    profileGeneration: true,
  },
} as const;

export const TEMPLATE_FAIR_USE_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxActiveTemplates: 100,
  maxParsesPerMinute: 2,
  maxUploadsPerDay: 20,
  templateTokenHours: 24,
} as const;

export const GUEST_GENERATION_LIMIT = Number.parseInt(
  process.env.GUEST_GENERATION_LIMIT ?? "1",
  10,
);

export function canPlanUseFeature(
  plan: AccessPlan,
  feature: GatedFeature,
) {
  const limits = PLAN_LIMITS[plan];

  switch (feature) {
    case "BASIC_PROFILE":
      return plan !== "GUEST";
    case "CUSTOM_TEMPLATE":
      return limits.customTemplates;
    case "CAREER_EXPERIENCE":
      return limits.careerExperience;
    case "PROFILE_IMPORT":
      return limits.profileImport;
    case "PROFILE_GENERATION":
      return limits.profileGeneration;
  }
}
