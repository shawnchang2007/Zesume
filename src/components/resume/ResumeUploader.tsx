"use client";

import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

type ExtractResponse =
  | {
      success: true;
      data: {
        extractedText: string;
        fileName: string;
        characterCount: number;
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

type ResumeUploaderProps = {
  uploadedFileName: string | null;
  isExtracting: boolean;
  extractError: string | null;
  onExtractedText: (text: string, fileName: string) => void;
  onExtractingChange: (isExtracting: boolean) => void;
  onExtractErrorChange: (error: string | null) => void;
};

export function ResumeUploader({
  uploadedFileName,
  isExtracting,
  extractError,
  onExtractedText,
  onExtractingChange,
  onExtractErrorChange,
}: ResumeUploaderProps) {
  async function uploadFile(file: File) {
    onExtractErrorChange(null);

    if (file.size > MAX_FILE_SIZE) {
      onExtractErrorChange("File is too large. Please upload a file under 2MB.");
      return;
    }

    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      onExtractErrorChange(
        "PDF upload is not supported in v1.1. Please upload a .txt or .docx file.",
      );
      return;
    }

    if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".docx")) {
      onExtractErrorChange("Unsupported file type. Please upload a .txt or .docx file.");
      return;
    }

    onExtractingChange(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume/extract", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as ExtractResponse;

      if (!result.success) {
        onExtractErrorChange(result.error.message);
        return;
      }

      onExtractedText(result.data.extractedText, result.data.fileName);
    } catch {
      onExtractErrorChange("Could not extract text from this file. Please try again.");
    } finally {
      onExtractingChange(false);
    }
  }

  return (
    <div className="uploader">
      <label className="upload-box">
        <input
          accept=".txt,.docx"
          disabled={isExtracting}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              void uploadFile(file);
            }
          }}
          type="file"
        />
        <span className="upload-icon">
          {isExtracting ? (
            <Loader2 className="spin" size={18} aria-hidden="true" />
          ) : (
            <Upload size={18} aria-hidden="true" />
          )}
        </span>
        <span className="upload-copy">
          <strong>{isExtracting ? "Extracting..." : "Upload resume"}</strong>
          <small>.txt / .docx · 2MB max</small>
        </span>
        <span className="upload-pill">v1.1</span>
      </label>

      {uploadedFileName && !extractError ? (
        <div className="status status-success">
          <CheckCircle2 size={15} aria-hidden="true" />
          Extracted from {uploadedFileName}
        </div>
      ) : null}

      {extractError ? (
        <div className="status status-error">
          <AlertCircle size={15} aria-hidden="true" />
          {extractError}
        </div>
      ) : null}
    </div>
  );
}
