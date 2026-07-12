import { prisma } from "@/lib/db/prisma";

export async function getUserCareerItems(userId: string) {
  return prisma.careerItem.findMany({
    where: { userId, deletedAt: null, memoryEnabled: true },
    include: {
      bullets: { orderBy: { displayOrder: "asc" } },
      skills: { include: { skill: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}
