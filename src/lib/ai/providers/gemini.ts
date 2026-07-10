import { buildRewritePrompt } from "../prompts";
import type { RewriteResumeInput, RewriteResumeOutput } from "../types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1] ?? trimmed;
}

export async function rewriteWithGemini(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("AI_CONFIG_ERROR: GEMINI_API_KEY is required.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildRewritePrompt(input) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("AI_REQUEST_FAILED: Gemini request failed.");
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("AI_REQUEST_FAILED: Gemini returned an empty response.");
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
      throw new Error("Invalid Gemini JSON shape.");
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
      provider: "gemini",
      model,
    };
  } catch {
    throw new Error("AI_REQUEST_FAILED: Gemini returned invalid JSON.");
  }
}
