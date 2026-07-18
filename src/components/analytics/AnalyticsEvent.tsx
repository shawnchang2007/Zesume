"use client";

import { useEffect } from "react";
import {
  trackEvent,
  type AnalyticsParameters,
} from "@/lib/analytics/client";

type AnalyticsEventProps = {
  name: string;
  parameters?: AnalyticsParameters;
  sessionStorageKey?: string;
};

export function AnalyticsEvent({
  name,
  parameters = {},
  sessionStorageKey,
}: AnalyticsEventProps) {
  const serializedParameters = JSON.stringify(parameters);

  useEffect(() => {
    if (sessionStorageKey) {
      try {
        if (window.sessionStorage.getItem(sessionStorageKey)) return;
      } catch {
        // Analytics must never interrupt the product experience.
      }
    }

    trackEvent(
      name,
      JSON.parse(serializedParameters) as AnalyticsParameters,
    );

    if (sessionStorageKey) {
      try {
        window.sessionStorage.setItem(sessionStorageKey, "1");
      } catch {
        // Storage may be disabled by the browser's privacy settings.
      }
    }
  }, [name, serializedParameters, sessionStorageKey]);

  return null;
}
