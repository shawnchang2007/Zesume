import { parseCareerItemInput, type CareerItemInput } from "./types";

export type CareerImportDraftData = {
  items: CareerItemInput[];
  warnings: string[];
};

function cleanJson(text: string) {
  return text.trim().replace(/^```(?:json)?\s*|\s*```$/gi, "");
}

function normalizeItem(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  return parseCareerItemInput({
    type: item.type,
    title: item.title,
    organization: item.organization ?? null,
    location: item.location ?? null,
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
    isCurrent: item.isCurrent === true,
    summary: item.summary ?? null,
    rawContent: item.rawContent ?? null,
    optimizedDescription: item.optimizedDescription ?? null,
    memoryEnabled: true,
    bullets: Array.isArray(item.bullets) ? item.bullets : [],
    skills: Array.isArray(item.skills) ? item.skills : [],
  });
}

export function parseCareerImportOutput(value: unknown): CareerImportDraftData {
  const parsed = typeof value === "string" ? JSON.parse(cleanJson(value)) : value;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid career import output.");
  }
  const record = parsed as Record<string, unknown>;
  const items = (Array.isArray(record.items) ? record.items : [])
    .slice(0, 30)
    .map(normalizeItem)
    .filter((item): item is CareerItemInput => Boolean(item));
  const warnings = (Array.isArray(record.warnings) ? record.warnings : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 20);

  if (!items.length) throw new Error("No valid Career Items were returned.");
  return { items, warnings };
}
