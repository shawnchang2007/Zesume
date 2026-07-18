export type AnalyticsPrimitive = string | number | boolean;
export type AnalyticsItem = Record<string, AnalyticsPrimitive>;
export type AnalyticsParameter =
  | AnalyticsPrimitive
  | ReadonlyArray<AnalyticsItem>
  | null
  | undefined;
export type AnalyticsParameters = Record<string, AnalyticsParameter>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MAX_PARAMETER_LENGTH = 100;
const MAX_ITEMS = 10;
const BLOCKED_PARAMETER_KEYS = new Set([
  "email",
  "file_content",
  "file_name",
  "full_name",
  "phone",
  "resume_text",
  "rewritten_resume",
]);

function cleanPrimitive(value: AnalyticsPrimitive): AnalyticsPrimitive {
  return typeof value === "string"
    ? value.trim().slice(0, MAX_PARAMETER_LENGTH)
    : value;
}

export function sanitizeAnalyticsParameters(
  parameters: AnalyticsParameters,
): Record<string, AnalyticsPrimitive | AnalyticsItem[]> {
  const sanitized: Record<string, AnalyticsPrimitive | AnalyticsItem[]> = {};

  for (const [key, value] of Object.entries(parameters)) {
    if (
      value === null ||
      value === undefined ||
      BLOCKED_PARAMETER_KEYS.has(key)
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, MAX_ITEMS).map((item) =>
        Object.fromEntries(
          Object.entries(item as AnalyticsItem)
            .filter(([itemKey]) => !BLOCKED_PARAMETER_KEYS.has(itemKey))
            .map(([itemKey, itemValue]) => [
              itemKey,
              cleanPrimitive(itemValue),
            ]),
        ),
      );
      continue;
    }

    sanitized[key] = cleanPrimitive(value as AnalyticsPrimitive);
  }

  return sanitized;
}

function getGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  return window.gtag;
}

export function trackEvent(
  eventName: string,
  parameters: AnalyticsParameters = {},
) {
  if (typeof window === "undefined") return;

  getGtag()("event", eventName, sanitizeAnalyticsParameters(parameters));
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  trackEvent("page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: document.title,
  });
}
