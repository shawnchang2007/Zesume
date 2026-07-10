import { buildRewritePrompt } from "../prompts";
import type { RewriteResumeInput, RewriteResumeOutput } from "../types";

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1] ?? trimmed;
}

export async function rewriteWithDeepSeek(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("AI_CONFIG_ERROR: DEEPSEEK_API_KEY is required.");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: buildRewritePrompt(input),
        },
      ],
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("AI_PAYMENT_REQUIRED: DeepSeek account has insufficient balance.");
    }

    throw new Error("AI_REQUEST_FAILED: DeepSeek request failed.");
  }

  const data = (await response.json()) as DeepSeekResponse;
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned an empty response.");
  }

  try {
    const parsed = JSON.parse(extractJson(text)) as {
      rewrittenResume?: unknown;
      suggestions?: unknown;
      qualityWarnings?: unknown;
    };

    if (
      typeof parsed.rewrittenResume !== "string" ||
      !Array.isArray(parsed.suggestions)
    ) {
      throw new Error("Invalid DeepSeek JSON shape.");
    }

    return {
      rewrittenResume: parsed.rewrittenResume,
      suggestions: parsed.suggestions.filter(
        (suggestion): suggestion is string => typeof suggestion === "string",
      ),
      qualityWarnings: Array.isArray(parsed.qualityWarnings)
        ? parsed.qualityWarnings.filter(
            (warning): warning is string => typeof warning === "string",
          )
        : [],
      provider: "deepseek",
      model,
    };
  } catch {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned invalid JSON.");
  }
}
