import { analyzeCareerImportWithDeepSeek, rewriteWithDeepSeek } from "./providers/deepseek";
import { rewriteWithGemini } from "./providers/gemini";
import { rewriteWithMock } from "./providers/mock";
import type {
  AnalyzeCareerImportInput,
  AnalyzeCareerImportOutput,
  RewriteResumeInput,
  RewriteResumeOutput,
} from "./types";
import { parseCareerImportOutput } from "@/lib/career-items/import";

export async function rewriteResume(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  const provider = process.env.AI_PROVIDER || "mock";

  switch (provider) {
    case "deepseek":
      return rewriteWithDeepSeek(input);
    case "gemini":
      return rewriteWithGemini(input);
    case "mock":
      return rewriteWithMock(input);
    default:
      throw new Error(`AI_CONFIG_ERROR: Unsupported provider "${provider}".`);
  }
}

export async function analyzeCareerImport(
  input: AnalyzeCareerImportInput,
): Promise<AnalyzeCareerImportOutput> {
  const provider = process.env.AI_PROVIDER || "mock";
  if (provider === "deepseek") return analyzeCareerImportWithDeepSeek(input);
  if (provider === "mock") {
    return {
      ...parseCareerImportOutput({
        items: [{
          type: "PROJECT",
          title: "Imported resume item",
          organization: null,
          location: null,
          startDate: null,
          endDate: null,
          isCurrent: false,
          summary: "Review this imported item before saving it to Career Memory.",
          rawContent: input.resumeText.slice(0, 500),
          optimizedDescription: "Review and refine this imported experience.",
          memoryEnabled: true,
          bullets: [],
          skills: [],
        }],
        warnings: ["Mock import creates one review item."],
      }),
      provider: "mock",
      model: "mock-career-import",
    };
  }
  throw new Error(`AI_CONFIG_ERROR: Career import is unavailable for provider "${provider}".`);
}
