import {
  buildCareerImportPrompt,
  buildRewritePrompt,
  buildTemplateAnalysisPrompt,
} from "../prompts";
import { fetchWithAiRetry } from "../fetch-with-timeout";
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
    finish_reason?: string | null;
    message?: {
      content?: string;
    };
  }>;
};

type DeepSeekRequestBody = {
  model: string;
  messages: Array<{ role: "user"; content: string }>;
  response_format: { type: "json_object" };
  thinking: { type: "enabled" | "disabled" };
  max_tokens: number;
  stream: false;
  temperature: number;
};

function preserveAiError(error: unknown, fallback: string): never {
  if (error instanceof Error && error.message.startsWith("AI_")) {
    throw error;
  }

  throw new Error(`AI_PROVIDER_UNAVAILABLE: ${fallback}`);
}

function assertSuccessfulResponse(response: Response) {
  if (response.ok) return;

  if (response.status === 402) {
    throw new Error("AI_PAYMENT_REQUIRED: DeepSeek account has insufficient balance.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("AI_AUTH_ERROR: DeepSeek rejected the configured API key.");
  }
  if (response.status === 429) {
    throw new Error("AI_RATE_LIMITED: DeepSeek is temporarily busy.");
  }
  if (response.status >= 500) {
    throw new Error("AI_PROVIDER_UNAVAILABLE: DeepSeek is temporarily unavailable.");
  }

  throw new Error("AI_REQUEST_FAILED: DeepSeek rejected the request.");
}

function assertFinishReason(data: DeepSeekResponse) {
  const finishReason = data.choices?.[0]?.finish_reason;

  if (finishReason === "length") {
    throw new Error("AI_OUTPUT_TRUNCATED: DeepSeek reached its output limit.");
  }
  if (finishReason === "content_filter") {
    throw new Error("AI_CONTENT_FILTERED: DeepSeek could not complete this content.");
  }
  if (finishReason === "insufficient_system_resource") {
    throw new Error("AI_PROVIDER_UNAVAILABLE: DeepSeek ran out of temporary capacity.");
  }
}

async function requestDeepSeek(
  apiKey: string,
  body: DeepSeekRequestBody,
): Promise<{ data: DeepSeekResponse; attempts: number }> {
  let result;

  try {
    result = await fetchWithAiRetry("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    preserveAiError(error, "DeepSeek request failed.");
  }

  assertSuccessfulResponse(result.response);

  let data: DeepSeekResponse;
  try {
    data = await readJsonResponse<DeepSeekResponse>(
      result.response,
      MAX_AI_RESPONSE_BYTES,
    );
  } catch {
    throw new Error("AI_INVALID_RESPONSE: DeepSeek returned an invalid response.");
  }

  assertFinishReason(data);
  return { data, attempts: result.attempts };
}

export async function rewriteWithDeepSeek(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("AI_CONFIG_ERROR: DEEPSEEK_API_KEY is required.");
  }

  const { data, attempts } = await requestDeepSeek(apiKey, {
    model,
    messages: [{ role: "user", content: buildRewritePrompt(input) }],
    response_format: { type: "json_object" },
    thinking: { type: thinkingMode() },
    max_tokens: 6_000,
    stream: false,
    temperature: 0.4,
  });
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI_REQUEST_FAILED: DeepSeek returned an empty response.");
  }

  try {
    return { ...parseRewriteModelOutput(text, "deepseek", model), attempts };
  } catch {
    throw new Error("AI_INVALID_RESPONSE: DeepSeek returned invalid resume JSON.");
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

  const { data, attempts } = await requestDeepSeek(apiKey, {
    model,
    messages: [{ role: "user", content: buildTemplateAnalysisPrompt(input) }],
    response_format: { type: "json_object" },
    thinking: { type: thinkingMode() },
    max_tokens: 2_500,
    stream: false,
    temperature: 0.1,
  });
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

    return { templateSpec, provider: "deepseek", model, attempts };
  } catch {
    throw new Error("AI_INVALID_RESPONSE: DeepSeek returned invalid template JSON.");
  }
}

export async function analyzeCareerImportWithDeepSeek(
  input: AnalyzeCareerImportInput,
): Promise<AnalyzeCareerImportOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  if (!apiKey) throw new Error("AI_CONFIG_ERROR: DEEPSEEK_API_KEY is required.");

  const { data, attempts } = await requestDeepSeek(apiKey, {
    model,
    messages: [{ role: "user", content: buildCareerImportPrompt(input) }],
    response_format: { type: "json_object" },
    thinking: { type: thinkingMode() },
    max_tokens: 8_000,
    stream: false,
    temperature: 0.1,
  });
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI_REQUEST_FAILED: DeepSeek returned an empty career import.");

  try {
    return { ...parseCareerImportOutput(text), provider: "deepseek", model, attempts };
  } catch {
    throw new Error("AI_INVALID_RESPONSE: DeepSeek returned invalid career import JSON.");
  }
}
