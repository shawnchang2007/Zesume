import { describe, expect, it } from "vitest";
import { parseCareerImportOutput } from "@/lib/career-items/import";
import { parseCareerItemInput } from "@/lib/career-items/types";

const validItem = {
  type: "PROJECT",
  title: "Resume platform",
  organization: null,
  location: null,
  startDate: "2026-01-01",
  endDate: null,
  isCurrent: true,
  summary: "Built a resume workflow.",
  rawContent: "Original project text.",
  optimizedDescription: "Built a factual resume workflow.",
  memoryEnabled: true,
  bullets: ["Built the import flow."],
  skills: ["TypeScript"],
};

describe("Career Item input", () => {
  it("accepts the supported user-facing categories", () => {
    for (const type of [
      "EDUCATION",
      "EMPLOYMENT",
      "PROJECT",
      "AWARD",
      "SKILL",
      "CERTIFICATION",
      "VOLUNTEERING",
    ]) {
      expect(parseCareerItemInput({ ...validItem, type })?.type).toBe(type);
    }
  });

  it("rejects missing titles and unsupported categories", () => {
    expect(parseCareerItemInput({ ...validItem, title: "" })).toBeNull();
    expect(parseCareerItemInput({ ...validItem, type: "UNKNOWN" })).toBeNull();
  });

  it("normalizes AI drafts and forces review items to memory enabled", () => {
    const result = parseCareerImportOutput({
      items: [{ ...validItem, memoryEnabled: false }],
      warnings: ["Review the date."],
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].memoryEnabled).toBe(true);
    expect(result.warnings).toEqual(["Review the date."]);
  });
});
