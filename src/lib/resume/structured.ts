import type {
  StructuredResume,
  StructuredResumeHeader,
  StructuredResumeItem,
} from "@/lib/ai/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function normalizeHeader(value: unknown): StructuredResumeHeader {
  const header = isRecord(value) ? value : {};

  return {
    name: stringValue(header.name),
    location: stringValue(header.location),
    email: stringValue(header.email),
    phone: stringValue(header.phone),
    links: stringList(header.links),
  };
}

function normalizeItem(value: unknown): StructuredResumeItem | null {
  if (!isRecord(value)) return null;

  return {
    name: stringValue(value.name),
    role: stringValue(value.role),
    organization: stringValue(value.organization),
    date: stringValue(value.date),
    location: stringValue(value.location),
    meta: stringValue(value.meta),
    details: stringList(value.details),
    bullets: stringList(value.bullets),
  };
}

export function normalizeStructuredResume(value: unknown): StructuredResume | null {
  if (!isRecord(value) || !Array.isArray(value.sections)) return null;

  const sections = value.sections
    .filter(isRecord)
    .map((section) => ({
      title: stringValue(section.title),
      items: Array.isArray(section.items)
        ? section.items.map(normalizeItem).filter((item): item is StructuredResumeItem => Boolean(item))
        : [],
    }))
    .filter((section) => section.title && section.items.length > 0);

  if (!sections.length) return null;

  const notes = isRecord(value.qualityNotes) ? value.qualityNotes : {};

  return {
    header: normalizeHeader(value.header),
    sections,
    qualityNotes: {
      majorChangesMade: stringList(notes.majorChangesMade),
      missingInformation: stringList(notes.missingInformation),
      warnings: stringList(notes.warnings),
    },
  };
}

function renderHeader(header: StructuredResumeHeader) {
  const contactLine = [
    header.location,
    header.email,
    header.phone,
    ...header.links,
  ]
    .filter(Boolean)
    .join(" | ");

  return [header.name, contactLine].filter(Boolean).join("\n");
}

function renderItem(item: StructuredResumeItem) {
  const roleLine = [item.role, item.organization].filter(Boolean).join(" | ");
  const contextLine = [item.meta, item.date, item.location]
    .filter(Boolean)
    .join(" | ");

  return [
    item.name,
    roleLine,
    contextLine,
    ...item.details,
    ...item.bullets.map((bullet) => `- ${bullet.replace(/^[-*•]\s*/, "")}`),
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderStructuredResume(resume: StructuredResume) {
  const header = renderHeader(resume.header);
  const sections = resume.sections.map((section) =>
    [section.title.toUpperCase(), ...section.items.map(renderItem)]
      .filter(Boolean)
      .join("\n\n"),
  );

  return [header, ...sections].filter(Boolean).join("\n\n");
}
