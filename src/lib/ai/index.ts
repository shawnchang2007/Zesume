import { rewriteWithDeepSeek } from "./providers/deepseek";
import { rewriteWithGemini } from "./providers/gemini";
import { rewriteWithMock } from "./providers/mock";
import type { RewriteResumeInput, RewriteResumeOutput } from "./types";

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
