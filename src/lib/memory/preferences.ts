import { prisma } from "@/lib/db/prisma";
import type { UserPreferenceMemory } from "./types";

export type UpsertUserPreferencesInput = Partial<UserPreferenceMemory>;

export async function getUserPreferences(userId: string) {
  return prisma.userPreference.findUnique({
    where: { userId },
  });
}

export async function upsertUserPreferences(
  userId: string,
  data: UpsertUserPreferencesInput,
) {
  return prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      preferredTone: data.preferredTone,
      preferredBulletStyle: data.preferredBulletStyle,
      avoidPhrases: data.avoidPhrases ?? [],
      defaultTemplate: data.defaultTemplate,
      defaultUseMemory: data.defaultUseMemory ?? false,
    },
    update: {
      preferredTone: data.preferredTone,
      preferredBulletStyle: data.preferredBulletStyle,
      avoidPhrases: data.avoidPhrases,
      defaultTemplate: data.defaultTemplate,
      defaultUseMemory: data.defaultUseMemory,
    },
  });
}
