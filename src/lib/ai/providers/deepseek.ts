import {
  buildCareerImportPrompt,
  buildRewritePrompt,
  buildTemplateAnalysisPrompt,
} from "../prompts";
import { fetchWithAiTimeout } from "../fetch-with-timeout";
import { parseRewriteModelOutput } from "../parse-output";
import type {
  AnalyzeResumeTemplateInput,
  AnalyzeResumeTemplateOutput,
  AnalyzeCareerImportInput,
  AnalyzeCareerImportOutput,
  RewriteResumeInput,
  RewriteResumeOutput,
} from "../types";
import { parseUploadedTemplateSpec } from "@/lib/resume/templates";
import { readJsonResponse } from "@/lib/http/body";
import { parseCareerImportOutput } from "@/lib/career-items/import";

const MAX_AI_RESPONSE_BYTES = 1024 * 1024;

function thinkingMode() {
  return process.env.DEEPSEEK_THINKING === "enabled" ? "enabled" : "disabled";
}

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function rewriteWithDeepSeek(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("AI_CONFIG_ERROR: DEEPSEEK_API_KEY is required.");
  }

  let response: Response;

  try {
    response = await fetchWithAiTimeout(
      "https://api.deepseek.com/chat/completions",
      {
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
          thinking: { type: thinkingMode() },
          max_tokens: 6_000,
          stream: false,
          temperature: 0.4,
        }),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AI_TIMEOUT")) {
      throw error;
    }

    throw new Error("AI_REQUEST_FAILED: DeepSeek request failed.");
  }

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("AI_PAYMENT_REQUIRED: DeepSeek account has insufficient balance.");
    }

    throw new Error("AI_REQUEST_FAILED: DeepSeek request failed.");
  }

  let data: DeepSeekResponse;

  try {
    data = await readJsonResponse<DeepSeekResponse>(
      response,
      MAX_AI_RESPONSE_BYTES,
    );
  } catch {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned an invalid response.");
  }
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned an empty response.");
  }

  try {
    return parseRewriteModelOutput(text, "deepseek", model);
  } catch {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned invalid JSON.");
  }
}

export async function analyzeTemplateWithDeepSeek(
  input: AnalyzeResumeTemplateInput,
): Promise<AnalyzeResumeTemplateOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("AI_CONFIG_ERROR: DEEPSEEK_API_KEY is required.");
  }

  let response: Response;

  try {
    response = await fetchWithAiTimeout(
      "https://api.deepseek.com/chat/completions",
      {
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
              content: buildTemplateAnalysisPrompt(input),
            },
          ],
          response_format: { type: "json_object" },
          thinking: { type: thinkingMode() },
          max_tokens: 2_500,
          stream: false,
          temperature: 0.1,
        }),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AI_TIMEOUT")) {
      throw error;
    }

    throw new Error("AI_REQUEST_FAILED: DeepSeek template analysis failed.");
  }

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("AI_PAYMENT_REQUIRED: DeepSeek account has insufficient balance.");
    }

    throw new Error("AI_REQUEST_FAILED: DeepSeek template analysis failed.");
  }

  let data: DeepSeekResponse;

  try {
    data = await readJsonResponse<DeepSeekResponse>(
      response,
      MAX_AI_RESPONSE_BYTES,
    );
  } catch {
    throw new Error(
      "AI_REQUEST_FAILED: DeepSeek returned an invalid template response.",
    );
  }
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned an empty template analysis.");
  }

  try {
    const parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/gi, ""));
    const templateSpec = parseUploadedTemplateSpec(parsed);

    if (!templateSpec) {
      throw new Error("Invalid template specification.");
    }

    return { templateSpec, provider: "deepseek", model };
  } catch {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned invalid template JSON.");
  }
}

export async function analyzeCareerImportWithDeepSeek(
  input: AnalyzeCareerImportInput,
): Promise<AnalyzeCareerImportOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  if (!apiKey) throw new Error("AI_CONFIG_ERROR: DEEPSEEK_API_KEY is required.");

  let response: Response;
  try {
    response = await fetchWithAiTimeout("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: buildCareerImportPrompt(input) }],
        response_format: { type: "json_object" },
        thinking: { type: thinkingMode() },
        max_tokens: 8_000,
        stream: false,
        temperature: 0.1,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AI_TIMEOUT")) throw error;
    throw new Error("AI_REQUEST_FAILED: Career import analysis failed.");
  }
  if (!response.ok) {
    if (response.status === 402) throw new Error("AI_PAYMENT_REQUIRED: DeepSeek account has insufficient balance.");
    throw new Error("AI_REQUEST_FAILED: Career import analysis failed.");
  }

  const data = await readJsonResponse<DeepSeekResponse>(response, MAX_AI_RESPONSE_BYTES);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI_REQUEST_FAILED: DeepSeek returned an empty career import.");

  try {
    return { ...parseCareerImportOutput(text), provider: "deepseek", model };
  } catch {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned invalid career import JSON.");
  }
}
