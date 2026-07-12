export const CAREER_ITEM_TYPES = [
  "EDUCATION",
  "EMPLOYMENT",
  "PROJECT",
  "AWARD",
  "SKILL",
  "CERTIFICATION",
  "VOLUNTEERING",
] as const;

export type ManagedCareerItemType = (typeof CAREER_ITEM_TYPES)[number];

export type CareerItemInput = {
  type: ManagedCareerItemType;
  title: string;
  organization: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  summary: string | null;
  rawContent: string | null;
  optimizedDescription: string | null;
  memoryEnabled: boolean;
  bullets: string[];
  skills: string[];
};

function optionalString(value: unknown, maxLength: number) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, maxLength) || null;
}

function dateString(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : value;
}

function stringList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function parseCareerItemInput(value: unknown): CareerItemInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const type = CAREER_ITEM_TYPES.find((item) => item === input.type);
  const title = optionalString(input.title, 160);
  const organization = optionalString(input.organization, 160);
  const location = optionalString(input.location, 120);
  const startDate = dateString(input.startDate);
  const endDate = dateString(input.endDate);
  const summary = optionalString(input.summary, 1_500);
  const rawContent = optionalString(input.rawContent, 5_000);
  const optimizedDescription = optionalString(input.optimizedDescription, 3_000);
  const bullets = stringList(input.bullets, 12, 500);
  const skills = stringList(input.skills, 20, 80);

  if (
    !type ||
    !title ||
    organization === undefined ||
    location === undefined ||
    startDate === undefined ||
    endDate === undefined ||
    summary === undefined ||
    rawContent === undefined ||
    optimizedDescription === undefined ||
    bullets === undefined ||
    skills === undefined
  ) {
    return null;
  }

  return {
    type,
    title,
    organization,
    location,
    startDate,
    endDate,
    isCurrent: input.isCurrent === true,
    summary,
    rawContent,
    optimizedDescription,
    memoryEnabled: input.memoryEnabled !== false,
    bullets,
    skills,
  };
}
