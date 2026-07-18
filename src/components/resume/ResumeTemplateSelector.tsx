"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  FileSearch,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import type { AccessPlan } from "@/lib/billing/plan-config";
import { trackEvent } from "@/lib/analytics/client";
import {
  builtInResumeTemplates,
  type ResumeTemplateId,
  type ResumeTemplateSpec,
} from "@/lib/resume/templates";

type ResumeTemplateSelectorProps = {
  value: ResumeTemplateId;
  onChange: (value: ResumeTemplateId) => void;
  uploadedTemplateSpec: ResumeTemplateSpec | null;
  uploadedTemplateFileName: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  canUploadTemplate: boolean;
  onAnalysisStart: () => void;
  onAnalysisSuccess: (
    templateSpec: ResumeTemplateSpec,
    customTemplateId: string,
    fileName: string,
    file: File,
  ) => void;
  onAnalysisError: (message: string) => void;
  onAnalysisEnd: () => void;
  plan: AccessPlan;
};

type AnalyzeTemplateResponse =
  | {
      success: true;
      data: {
        templateSpec: ResumeTemplateSpec;
        customTemplateId: string;
        fileName: string;
        provider: string;
        model: string;
      };
    }
  | {
      success: false;
      error: { code: string; message: string };
    };

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function ResumeTemplateSelector({
  value,
  onChange,
  uploadedTemplateSpec,
  uploadedTemplateFileName,
  isAnalyzing,
  analysisError,
  canUploadTemplate,
  onAnalysisStart,
  onAnalysisSuccess,
  onAnalysisError,
  onAnalysisEnd,
  plan,
}: ResumeTemplateSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function analyzeTemplate(file: File) {
    const lowerName = file.name.toLowerCase();
    const fileType = lowerName.endsWith(".docx")
      ? "docx"
      : lowerName.endsWith(".txt")
        ? "txt"
        : lowerName.endsWith(".pdf")
          ? "pdf"
          : "unsupported";

    if (file.size > MAX_FILE_SIZE) {
      trackEvent("template_analysis_failed", {
        file_type: fileType,
        error_code: "FILE_TOO_LARGE",
        plan,
      });
      onAnalysisError("Template is too large. Please upload a file under 2MB.");
      return;
    }

    if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".docx")) {
      trackEvent("template_analysis_failed", {
        file_type: fileType,
        error_code: "UNSUPPORTED_FILE_TYPE",
        plan,
      });
      onAnalysisError(
        lowerName.endsWith(".pdf")
          ? "PDF template analysis is not supported yet. Please upload a .txt or .docx file."
          : "Unsupported template type. Please upload a .txt or .docx file.",
      );
      return;
    }

    const startedAt = performance.now();
    trackEvent("template_analysis_started", {
      file_type: fileType,
      plan,
    });
    onAnalysisStart();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume/template/analyze", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as AnalyzeTemplateResponse;

      if (!result.success) {
        trackEvent("template_analysis_failed", {
          file_type: fileType,
          error_code: result.error.code,
          duration_ms: Math.round(performance.now() - startedAt),
          plan,
        });
        onAnalysisError(result.error.message);
        return;
      }

      trackEvent("template_analysis_succeeded", {
        file_type: fileType,
        provider: result.data.provider,
        model: result.data.model,
        duration_ms: Math.round(performance.now() - startedAt),
        plan,
      });
      onAnalysisSuccess(
        result.data.templateSpec,
        result.data.customTemplateId,
        result.data.fileName,
        file,
      );
    } catch {
      trackEvent("template_analysis_failed", {
        file_type: fileType,
        error_code: "NETWORK_ERROR",
        duration_ms: Math.round(performance.now() - startedAt),
        plan,
      });
      onAnalysisError("Could not analyze this template. Please try again.");
    } finally {
      onAnalysisEnd();
    }
  }

  return (
    <div className="field-group">
      <span className="field-label">Resume template</span>
      <div
        className="resume-template-grid"
        role="radiogroup"
        aria-label="Resume template"
      >
        {builtInResumeTemplates.map((template) => {
          const isActive = value === template.id;

          return (
            <button
              aria-checked={isActive}
              className={`resume-template-card ${isActive ? "active" : ""}`}
              key={template.id}
              onClick={() => onChange(template.id)}
              role="radio"
              type="button"
            >
              <span className="resume-template-icon" aria-hidden="true">
                {isActive ? <Check size={16} /> : <LayoutTemplate size={16} />}
              </span>
              <span className="resume-template-copy">
                <strong>{template.name}</strong>
                <small>{template.bestFor.join(" · ")}</small>
                <span>{template.description}</span>
              </span>
            </button>
          );
        })}

        <button
          aria-checked={value === "uploaded-template"}
          className={`resume-template-card uploaded-template-card premium-feature ${
            value === "uploaded-template" ? "active" : ""
          } ${canUploadTemplate ? "" : "locked"}`}
          disabled={isAnalyzing}
          onClick={() => {
            if (!canUploadTemplate) {
              trackEvent("paywall_viewed", {
                feature: "custom_template",
                plan,
              });
              router.push("/pricing");
              return;
            }

            if (uploadedTemplateSpec && value !== "uploaded-template") {
              onChange("uploaded-template");
              return;
            }

            fileInputRef.current?.click();
          }}
          role="radio"
          type="button"
        >
          <span className="resume-template-icon" aria-hidden="true">
            {isAnalyzing ? (
              <Loader2 className="spin" size={16} />
            ) : !canUploadTemplate ? (
              <LockKeyhole size={16} />
            ) : value === "uploaded-template" ? (
              <Check size={16} />
            ) : (
              <FileSearch size={16} />
            )}
          </span>
          <span className="resume-template-copy">
            <strong>
              {uploadedTemplateSpec?.name ?? "Uploaded Template"}
            </strong>
            <small>
              {isAnalyzing
                ? "Analyzing with DeepSeek..."
                : !canUploadTemplate
                  ? `${plan === "GUEST" ? "Sign in · " : ""}Plus / Pro only`
                  : uploadedTemplateFileName ?? ".txt / .docx · 2MB max"}
            </small>
            <span>
              {uploadedTemplateSpec?.description ??
                "Upload your own resume structure and let AI learn its section order and bullet style."}
            </span>
          </span>
        </button>
      </div>

      <input
        accept=".txt,.docx"
        className="template-file-input"
        disabled={isAnalyzing}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void analyzeTemplate(file);
        }}
        ref={fileInputRef}
        type="file"
      />

      {uploadedTemplateSpec && value === "uploaded-template" ? (
        <div className="template-analysis-summary">
          <span>
            <Check size={14} aria-hidden="true" /> Template ready
          </span>
          <span>{uploadedTemplateSpec.density} density</span>
          <span>{uploadedTemplateSpec.sectionOrder.join(" → ")}</span>
        </div>
      ) : null}

      {analysisError ? (
        <div className="status status-error">
          <AlertCircle size={15} aria-hidden="true" />
          {analysisError}
        </div>
      ) : null}

      {!canUploadTemplate ? (
        <div className="template-upgrade-note">
          Upload Template is available on Plus and Pro. <Link href="/pricing">Compare plans</Link>
        </div>
      ) : null}
    </div>
  );
}
