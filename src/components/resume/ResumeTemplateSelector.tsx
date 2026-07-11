"use client";

import { useRef } from "react";
import {
  AlertCircle,
  Check,
  FileSearch,
  LayoutTemplate,
  Loader2,
} from "lucide-react";
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
  onAnalysisStart: () => void;
  onAnalysisSuccess: (
    templateSpec: ResumeTemplateSpec,
    fileName: string,
    file: File,
  ) => void;
  onAnalysisError: (message: string) => void;
  onAnalysisEnd: () => void;
};

type AnalyzeTemplateResponse =
  | {
      success: true;
      data: {
        templateSpec: ResumeTemplateSpec;
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
  onAnalysisStart,
  onAnalysisSuccess,
  onAnalysisError,
  onAnalysisEnd,
}: ResumeTemplateSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function analyzeTemplate(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      onAnalysisError("Template is too large. Please upload a file under 2MB.");
      return;
    }

    const lowerName = file.name.toLowerCase();

    if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".docx")) {
      onAnalysisError(
        lowerName.endsWith(".pdf")
          ? "PDF template analysis is not supported yet. Please upload a .txt or .docx file."
          : "Unsupported template type. Please upload a .txt or .docx file.",
      );
      return;
    }

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
        onAnalysisError(result.error.message);
        return;
      }

      onAnalysisSuccess(result.data.templateSpec, result.data.fileName, file);
    } catch {
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
          className={`resume-template-card uploaded-template-card ${
            value === "uploaded-template" ? "active" : ""
          }`}
          disabled={isAnalyzing}
          onClick={() => {
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
    </div>
  );
}
