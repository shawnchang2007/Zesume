import { buildRewritePrompt } from "../prompts";
import { fetchWithAiRetry } from "../fetch-with-timeout";
import { parseRewriteModelOutput } from "../parse-output";
import type { RewriteResumeInput, RewriteResumeOutput } from "../types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function rewriteWithGemini(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("AI_CONFIG_ERROR: GEMINI_API_KEY is required.");
  }

  let response: Response;
  let attempts = 1;

  try {
    const result = await fetchWithAiRetry(
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
    response = result.response;
    attempts = result.attempts;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AI_")) {
      throw error;
    }

    throw new Error("AI_PROVIDER_UNAVAILABLE: Gemini request failed.");
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("AI_RATE_LIMITED: Gemini is temporarily busy.");
    }
    if (response.status >= 500) {
      throw new Error("AI_PROVIDER_UNAVAILABLE: Gemini is temporarily unavailable.");
    }
    throw new Error("AI_REQUEST_FAILED: Gemini request failed.");
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("AI_REQUEST_FAILED: Gemini returned an empty response.");
  }

  try {
    return { ...parseRewriteModelOutput(text, "gemini", model), attempts };
  } catch {
    throw new Error("AI_INVALID_RESPONSE: Gemini returned invalid JSON.");
  }
}
