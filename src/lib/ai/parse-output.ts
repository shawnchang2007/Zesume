import type {
  RewriteResumeOutput,
  StructuredResume,
} from "./types";
import {
  normalizeStructuredResume,
  renderStructuredResume,
} from "@/lib/resume/structured";

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1] ?? trimmed;
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function legacyStructuredResume(text: string): StructuredResume {
  return {
    header: {
      name: "",
      location: "",
      email: "",
      phone: "",
      links: [],
    },
    sections: [
      {
        title: "Resume",
        items: [
          {
            name: "",
            role: "",
            organization: "",
            date: "",
            location: "",
            meta: "",
            details: text.split(/\r?\n/).filter(Boolean),
            bullets: [],
          },
        ],
      },
    ],
    qualityNotes: {
      majorChangesMade: [],
      missingInformation: [],
      warnings: [],
    },
  };
}

export function parseRewriteModelOutput(
  text: string,
  provider: string,
  model: string,
): RewriteResumeOutput {
  const parsed = JSON.parse(extractJson(text)) as Record<string, unknown>;
  const structuredResume = normalizeStructuredResume(parsed);

  if (structuredResume) {
    const professionalResumeText =
      typeof parsed.professionalResumeText === "string" &&
      parsed.professionalResumeText.trim()
        ? parsed.professionalResumeText.trim()
        : renderStructuredResume(structuredResume);

    return {
      structuredResume,
      rewrittenResume: professionalResumeText,
      suggestions: structuredResume.qualityNotes.missingInformation,
      qualityWarnings: structuredResume.qualityNotes.warnings,
      provider,
      model,
    };
  }

  if (typeof parsed.rewrittenResume === "string") {
    return {
      structuredResume: legacyStructuredResume(parsed.rewrittenResume),
      rewrittenResume: parsed.rewrittenResume,
      suggestions: stringList(parsed.suggestions),
      qualityWarnings: stringList(parsed.qualityWarnings),
      provider,
      model,
    };
  }

  throw new Error("Invalid AI JSON shape.");
}
