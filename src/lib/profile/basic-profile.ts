import { prisma } from "@/lib/db/prisma";

export const BASIC_PROFILE_FIELDS = [
  "fullName",
  "contactEmail",
  "phone",
  "location",
  "school",
  "degree",
  "major",
  "graduationYear",
  "linkedinUrl",
  "githubUrl",
  "portfolioUrl",
  "targetRoles",
  "targetLocations",
  "preferredTone",
  "preferredLanguage",
  "spellingStyle",
  "resumeLength",
] as const;

export type BasicProfileInput = {
  fullName?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  location?: string | null;
  school?: string | null;
  degree?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  targetRoles?: string[];
  targetLocations?: string[];
  preferredTone?: string | null;
  preferredLanguage?: string | null;
  spellingStyle?: string | null;
  resumeLength?: string | null;
};

function optionalString(value: unknown, maxLength: number) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, maxLength) || null;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 10);
}

function optionalUrl(value: unknown) {
  const result = optionalString(value, 300);
  if (!result) return result;

  try {
    const url = new URL(result);
    return url.protocol === "http:" || url.protocol === "https:"
      ? result
      : undefined;
  } catch {
    return undefined;
  }
}

export function parseBasicProfileInput(value: unknown): BasicProfileInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const graduationYear =
    input.graduationYear === null || input.graduationYear === ""
      ? null
      : typeof input.graduationYear === "number" &&
          Number.isInteger(input.graduationYear) &&
          input.graduationYear >= 1950 &&
          input.graduationYear <= 2100
        ? input.graduationYear
        : undefined;

  return {
    fullName: optionalString(input.fullName, 120),
    contactEmail: optionalString(input.contactEmail, 254),
    phone: optionalString(input.phone, 40),
    location: optionalString(input.location, 120),
    school: optionalString(input.school, 160),
    degree: optionalString(input.degree, 120),
    major: optionalString(input.major, 120),
    graduationYear,
    linkedinUrl: optionalUrl(input.linkedinUrl),
    githubUrl: optionalUrl(input.githubUrl),
    portfolioUrl: optionalUrl(input.portfolioUrl),
    targetRoles: stringList(input.targetRoles),
    targetLocations: stringList(input.targetLocations),
    preferredTone: optionalString(input.preferredTone, 40),
    preferredLanguage: optionalString(input.preferredLanguage, 40),
    spellingStyle: optionalString(input.spellingStyle, 40),
    resumeLength: optionalString(input.resumeLength, 40),
  };
}

export function getBasicProfile(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}

export function upsertBasicProfile(userId: string, data: BasicProfileInput) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
      targetRoles: data.targetRoles ?? [],
      targetLocations: data.targetLocations ?? [],
      industries: [],
    },
    update: data,
  });
}
