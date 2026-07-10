import { prisma } from "@/lib/db/prisma";
import type { UserProfileMemory } from "./types";

export type UpsertUserProfileInput = Partial<UserProfileMemory>;

export async function getUserProfile(userId: string) {
  return prisma.userProfile.findUnique({
    where: { userId },
  });
}

export async function upsertUserProfile(
  userId: string,
  data: UpsertUserProfileInput,
) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: data.fullName,
      educationSummary: data.educationSummary,
      careerStage: data.careerStage,
      targetRoles: data.targetRoles ?? [],
      industries: data.industries ?? [],
      locationPreference: data.locationPreference,
      notes: data.notes,
    },
    update: {
      fullName: data.fullName,
      educationSummary: data.educationSummary,
      careerStage: data.careerStage,
      targetRoles: data.targetRoles,
      industries: data.industries,
      locationPreference: data.locationPreference,
      notes: data.notes,
    },
  });
}

export async function deleteUserProfile(userId: string) {
  return prisma.userProfile.delete({
    where: { userId },
  });
}
