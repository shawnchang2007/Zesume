"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import type { TargetTemplate } from "@/lib/ai/types";

type DownloadButtonsProps = {
  resumeText: string;
  targetTemplate: TargetTemplate;
  disabled: boolean;
  isExporting: boolean;
  onExportingChange: (value: boolean) => void;
  onExportErrorChange: (error: string | null) => void;
};

function fileTemplateName(targetTemplate: TargetTemplate) {
  return targetTemplate.replace(/_/g, "-");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DownloadButtons({
  resumeText,
  targetTemplate,
  disabled,
  isExporting,
  onExportingChange,
  onExportErrorChange,
}: DownloadButtonsProps) {
  const baseName = `zesume-${fileTemplateName(targetTemplate)}`;

  function downloadTxt() {
    if (disabled) return;
    onExportErrorChange(null);
    downloadBlob(new Blob([resumeText], { type: "text/plain;charset=utf-8" }), `${baseName}.txt`);
  }

  async function downloadDocx() {
    if (disabled || isExporting) return;

    onExportingChange(true);
    onExportErrorChange(null);

    try {
      const response = await fetch("/api/resume/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          targetTemplate,
          format: "docx",
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as {
          error?: { message?: string };
        };
        onExportErrorChange(result.error?.message || "Could not export DOCX.");
        return;
      }

      const blob = await response.blob();
      downloadBlob(blob, `${baseName}.docx`);
    } catch {
      onExportErrorChange("Could not export DOCX. Please try again.");
    } finally {
      onExportingChange(false);
    }
  }

  return (
    <>
      <button
        className="button button-secondary"
        disabled={disabled}
        onClick={downloadTxt}
        type="button"
      >
        <FileText size={16} aria-hidden="true" />
        Download TXT
      </button>
      <button
        className="button button-secondary"
        disabled={disabled || isExporting}
        onClick={() => void downloadDocx()}
        type="button"
      >
        {isExporting ? (
          <Loader2 className="spin" size={16} aria-hidden="true" />
        ) : (
          <Download size={16} aria-hidden="true" />
        )}
        {isExporting ? "Exporting" : "Download DOCX"}
      </button>
    </>
  );
}
