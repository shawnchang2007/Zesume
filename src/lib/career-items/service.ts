import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CareerItemInput } from "./types";

const careerItemInclude = {
  bullets: { orderBy: { displayOrder: "asc" as const } },
  skills: { include: { skill: true } },
};

function asDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function normalizedSkill(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function scalarData(input: CareerItemInput) {
  return {
    type: input.type,
    title: input.title,
    organization: input.organization,
    location: input.location,
    startDate: asDate(input.startDate),
    endDate: input.isCurrent ? null : asDate(input.endDate),
    isCurrent: input.isCurrent,
    summary: input.summary,
    rawContent: input.rawContent,
    optimizedDescription: input.optimizedDescription,
    memoryEnabled: input.memoryEnabled,
  };
}

async function attachRelations(
  transaction: Prisma.TransactionClient,
  careerItemId: string,
  input: CareerItemInput,
) {
  if (input.bullets.length) {
    await transaction.careerItemBullet.createMany({
      data: input.bullets.map((content, displayOrder) => ({
        careerItemId,
        content,
        displayOrder,
        source: "USER",
      })),
    });
  }

  for (const name of input.skills) {
    const skill = await transaction.skill.upsert({
      where: { normalizedName: normalizedSkill(name) },
      create: { name, normalizedName: normalizedSkill(name) },
      update: { name },
      select: { id: true },
    });
    await transaction.careerItemSkill.create({
      data: { careerItemId, skillId: skill.id },
    });
  }
}

export function listCareerItems(userId: string) {
  return prisma.careerItem.findMany({
    where: { userId, deletedAt: null },
    include: careerItemInclude,
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });
}

export function createCareerItem(userId: string, input: CareerItemInput) {
  return prisma.$transaction(async (transaction) => {
    const item = await transaction.careerItem.create({
      data: { userId, ...scalarData(input) },
      select: { id: true },
    });
    await attachRelations(transaction, item.id, input);
    return transaction.careerItem.findUniqueOrThrow({
      where: { id: item.id },
      include: careerItemInclude,
    });
  });
}

export async function updateCareerItem(
  userId: string,
  id: string,
  input: CareerItemInput,
) {
  const owned = await prisma.careerItem.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!owned) return null;

  return prisma.$transaction(async (transaction) => {
    await transaction.careerItem.update({
      where: { id },
      data: scalarData(input),
    });
    await transaction.careerItemBullet.deleteMany({ where: { careerItemId: id } });
    await transaction.careerItemSkill.deleteMany({ where: { careerItemId: id } });
    await attachRelations(transaction, id, input);
    return transaction.careerItem.findUniqueOrThrow({
      where: { id },
      include: careerItemInclude,
    });
  });
}

export async function deleteCareerItem(userId: string, id: string) {
  const result = await prisma.careerItem.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date(), memoryEnabled: false },
  });
  return result.count > 0;
}

export function commitCareerImportDraft(
  userId: string,
  draftId: string,
  inputs: CareerItemInput[],
) {
  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.resumeImportDraft.updateMany({
      where: {
        id: draftId,
        userId,
        status: "REVIEW",
        expiresAt: { gt: new Date() },
      },
      data: { status: "COMMITTED" },
    });
    if (!claimed.count) return null;

    const ids: string[] = [];
    for (const input of inputs) {
      const item = await transaction.careerItem.create({
        data: { userId, ...scalarData(input) },
        select: { id: true },
      });
      await attachRelations(transaction, item.id, input);
      ids.push(item.id);
    }
    return ids;
  });
}
