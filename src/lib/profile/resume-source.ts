import { prisma } from "@/lib/db/prisma";

function compact(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter(Boolean) as string[];
}

function monthLabel(value: Date | null) {
  if (!value) return "";
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function buildProfileResumeSource(userId: string) {
  const [profile, careerItems] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.careerItem.findMany({
      where: { userId, deletedAt: null, memoryEnabled: true },
      include: {
        bullets: { orderBy: { displayOrder: "asc" } },
        skills: { include: { skill: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }],
      take: 100,
    }),
  ]);

  const header = compact([
    profile?.fullName,
    compact([
      profile?.location,
      profile?.contactEmail,
      profile?.phone,
      profile?.linkedinUrl,
      profile?.githubUrl,
      profile?.portfolioUrl,
    ]).join(" | "),
  ]);
  const education = compact([
    profile?.school,
    compact([profile?.degree, profile?.major]).join(" · "),
    profile?.graduationYear
      ? `Expected graduation: ${profile.graduationYear}`
      : null,
  ]);
  const groupedItems = new Map<string, string[]>();

  for (const item of careerItems) {
    const section = item.type.replaceAll("_", " ");
    const date = compact([
      monthLabel(item.startDate),
      item.isCurrent ? "Present" : monthLabel(item.endDate),
    ]).join(" - ");
    const skills = item.skills.map(({ skill }) => skill.name);
    const tags = item.tags.map(({ tag }) => tag.name);
    const lines = compact([
      item.title,
      compact([item.organization, item.location, date]).join(" | "),
      item.optimizedDescription ?? item.summary ?? item.rawContent,
      skills.length ? `Skills: ${skills.join(", ")}` : null,
      tags.length ? `Tags: ${tags.join(", ")}` : null,
      ...item.bullets.map((bullet) => `- ${bullet.content}`),
    ]);
    groupedItems.set(section, [...(groupedItems.get(section) ?? []), lines.join("\n")]);
  }

  const sections = [
    header.join("\n"),
    education.length ? `EDUCATION\n${education.join("\n")}` : "",
    ...Array.from(groupedItems, ([title, items]) =>
      `${title.toUpperCase()}\n${items.join("\n\n")}`,
    ),
  ].filter(Boolean);

  return sections.join("\n\n").slice(0, 5_000).trim();
}
