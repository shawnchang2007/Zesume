"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import type { CareerTarget, StructuredResume } from "@/lib/ai/types";
import type { ResumeTemplateId } from "@/lib/resume/templates";
import { trackEvent } from "@/lib/analytics/client";

type DownloadButtonsProps = {
  resumeText: string;
  targetTrack: CareerTarget;
  templateId: ResumeTemplateId;
  structuredResume: StructuredResume | null;
  uploadedTemplateFile: File | null;
  disabled: boolean;
  isExporting: boolean;
  onExportingChange: (value: boolean) => void;
  onExportErrorChange: (error: string | null) => void;
};

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
  targetTrack,
  templateId,
  structuredResume,
  uploadedTemplateFile,
  disabled,
  isExporting,
  onExportingChange,
  onExportErrorChange,
}: DownloadButtonsProps) {
  const baseName = `zesume-${templateId}`;
  const usesUploadedTemplate = templateId === "uploaded-template";
  const canMatchUploadedDocx = Boolean(
    usesUploadedTemplate &&
      uploadedTemplateFile?.name.toLowerCase().endsWith(".docx") &&
      structuredResume,
  );

  function downloadTxt() {
    if (disabled) return;
    onExportErrorChange(null);
    downloadBlob(new Blob([resumeText], { type: "text/plain;charset=utf-8" }), `${baseName}.txt`);
    trackEvent("resume_download_succeeded", {
      format: "txt",
      target_track: targetTrack,
      template_id: templateId,
      matched_template: false,
    });
  }

  async function downloadDocx() {
    if (disabled || isExporting) return;

    onExportingChange(true);
    onExportErrorChange(null);
    const startedAt = performance.now();
    trackEvent("resume_download_started", {
      format: "docx",
      target_track: targetTrack,
      template_id: templateId,
      matched_template: canMatchUploadedDocx,
    });

    try {
      const isUploadedTemplate =
        canMatchUploadedDocx &&
        structuredResume &&
        uploadedTemplateFile;
      const requestBody = isUploadedTemplate
        ? (() => {
            const formData = new FormData();
            formData.append("resumeText", resumeText);
            formData.append("targetTrack", targetTrack);
            formData.append("templateId", templateId);
            formData.append("format", "docx");
            formData.append("structuredResume", JSON.stringify(structuredResume));
            formData.append("templateFile", uploadedTemplateFile);
            return formData;
          })()
        : JSON.stringify({
            resumeText,
            targetTrack,
            templateId,
            format: "docx",
          });
      const response = await fetch("/api/resume/export", {
        method: "POST",
        headers: isUploadedTemplate
          ? undefined
          : { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (!response.ok) {
        const result = (await response.json()) as {
          error?: { message?: string };
        };
        trackEvent("resume_download_failed", {
          format: "docx",
          target_track: targetTrack,
          template_id: templateId,
          matched_template: canMatchUploadedDocx,
          http_status: response.status,
          error_code: "EXPORT_FAILED",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        onExportErrorChange(result.error?.message || "Could not export DOCX.");
        return;
      }

      const blob = await response.blob();
      downloadBlob(blob, `${baseName}.docx`);
      trackEvent("resume_download_succeeded", {
        format: "docx",
        target_track: targetTrack,
        template_id: templateId,
        matched_template: canMatchUploadedDocx,
        duration_ms: Math.round(performance.now() - startedAt),
      });
    } catch {
      trackEvent("resume_download_failed", {
        format: "docx",
        target_track: targetTrack,
        template_id: templateId,
        matched_template: canMatchUploadedDocx,
        error_code: "NETWORK_ERROR",
        duration_ms: Math.round(performance.now() - startedAt),
      });
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
        {isExporting
          ? "Exporting"
          : canMatchUploadedDocx
            ? "Download matched DOCX"
            : "Download DOCX"}
      </button>
    </>
  );
}
