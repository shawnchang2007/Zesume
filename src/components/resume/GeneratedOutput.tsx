"use client";

import {
  Clipboard,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import type { TargetTemplate } from "@/lib/ai/types";
import { DownloadButtons } from "./DownloadButtons";

type GeneratedOutputProps = {
  rewrittenResume: string;
  suggestions: string[];
  qualityWarnings: string[];
  providerMeta: string;
  copied: boolean;
  isLoading: boolean;
  isExporting: boolean;
  exportError: string | null;
  targetTemplate: TargetTemplate;
  onCopy: () => void;
  onRegenerate: () => void;
  onExportingChange: (value: boolean) => void;
  onExportErrorChange: (error: string | null) => void;
};

export function GeneratedOutput({
  rewrittenResume,
  suggestions,
  qualityWarnings,
  providerMeta,
  copied,
  isLoading,
  isExporting,
  exportError,
  targetTemplate,
  onCopy,
  onRegenerate,
  onExportingChange,
  onExportErrorChange,
}: GeneratedOutputProps) {
  const hasOutput = Boolean(rewrittenResume);

  return (
    <section className="panel output-panel" aria-label="Generated output">
      <div className="panel-header">
        <h2 className="panel-title">Generated Output</h2>
        <span className="counter">{providerMeta || "Waiting for input"}</span>
      </div>

      {hasOutput ? (
        <div className="output-box">{rewrittenResume}</div>
      ) : (
        <div className="empty-output">
          <span>Generated resume will appear here.</span>
        </div>
      )}

      <div className="output-actions">
        <button
          className="button button-secondary"
          disabled={!hasOutput}
          onClick={onCopy}
          type="button"
        >
          {copied ? (
            <ClipboardCheck size={16} aria-hidden="true" />
          ) : (
            <Clipboard size={16} aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          className="button button-soft"
          disabled={!hasOutput || isLoading}
          onClick={onRegenerate}
          type="button"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Regenerate
        </button>
        <DownloadButtons
          disabled={!hasOutput}
          isExporting={isExporting}
          onExportErrorChange={onExportErrorChange}
          onExportingChange={onExportingChange}
          resumeText={rewrittenResume}
          targetTemplate={targetTemplate}
        />
      </div>

      {exportError ? <div className="error">{exportError}</div> : null}

      {qualityWarnings.length ? (
        <div className="quality-warnings">
          <h3>Quality Warnings</h3>
          <ul>
            {qualityWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestions.length ? (
        <div className="suggestions">
          <h3>Suggestions</h3>
          <ul>
            {suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
