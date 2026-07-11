import { describe, expect, it } from "vitest";

import { parseRewriteModelOutput } from "@/lib/ai/parse-output";
import { normalizeStructuredResume } from "@/lib/resume/structured";
import { parseUploadedTemplateSpec } from "@/lib/resume/templates";

describe("resume input and output limits", () => {
  it("caps legacy AI resume output", () => {
    const result = parseRewriteModelOutput(
      JSON.stringify({ rewrittenResume: "a".repeat(60_000) }),
      "mock",
      "test",
    );
    expect(result.rewrittenResume).toHaveLength(50_000);
  });

  it("caps structured sections and item bullets", () => {
    const normalized = normalizeStructuredResume({
      sections: Array.from({ length: 30 }, (_, sectionIndex) => ({
        title: `Section ${sectionIndex}`,
        items: [
          {
            name: "Item",
            bullets: Array.from({ length: 40 }, (_, index) => `Bullet ${index}`),
          },
        ],
      })),
    });

    expect(normalized?.sections).toHaveLength(20);
    expect(normalized?.sections[0].items[0].bullets).toHaveLength(20);
  });

  it("rejects incomplete uploaded template specifications", () => {
    expect(parseUploadedTemplateSpec({ name: "Only a name" })).toBeNull();
  });
});
