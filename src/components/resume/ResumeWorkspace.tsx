"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileUp,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { CareerTargetSelector } from "@/components/resume/CareerTargetSelector";
import { BrandMark } from "@/components/BrandMark";
import { GeneratedOutput } from "@/components/resume/GeneratedOutput";
import { ResumeInput } from "@/components/resume/ResumeInput";
import { ResumeTemplateSelector } from "@/components/resume/ResumeTemplateSelector";
import { ResumeUploader } from "@/components/resume/ResumeUploader";
import { ToneSelector } from "@/components/resume/ToneSelector";
import type { CareerTarget, StructuredResume, Tone } from "@/lib/ai/types";
import type {
  ResumeTemplateId,
  ResumeTemplateSpec,
} from "@/lib/resume/templates";
import type { AccessPlan } from "@/lib/billing/plan-config";
import { trackEvent } from "@/lib/analytics/client";

const MIN_RESUME_LENGTH = 200;
const MAX_RESUME_LENGTH = 5000;

type RewriteResponse =
  | {
      success: true;
      data: {
        rewrittenResume: string;
        structuredResume: StructuredResume;
        suggestions: string[];
        qualityWarnings: string[];
        provider: string;
        model: string;
        authenticated: boolean;
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

type ResumeWorkspaceProps = {
  authSlot: ReactNode;
  canImportFromProfile: boolean;
  canUploadTemplate: boolean;
  plan: AccessPlan;
};

export function ResumeWorkspace({
  authSlot,
  canImportFromProfile,
  canUploadTemplate,
  plan,
}: ResumeWorkspaceProps) {
  const [resumeText, setResumeText] = useState("");
  const [targetTrack, setTargetTrack] =
    useState<CareerTarget>("software_engineering");
  const [templateId, setTemplateId] =
    useState<ResumeTemplateId>("classic-ats");
  const [uploadedTemplateSpec, setUploadedTemplateSpec] =
    useState<ResumeTemplateSpec | null>(null);
  const [customTemplateId, setCustomTemplateId] = useState<string | null>(null);
  const [uploadedTemplateFileName, setUploadedTemplateFileName] =
    useState<string | null>(null);
  const [uploadedTemplateFile, setUploadedTemplateFile] =
    useState<File | null>(null);
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState(false);
  const [templateAnalysisError, setTemplateAnalysisError] =
    useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState("");
  const [structuredResume, setStructuredResume] =
    useState<StructuredResume | null>(null);
  const [generatedTemplateId, setGeneratedTemplateId] =
    useState<ResumeTemplateId>("classic-ats");
  const [generatedTargetTrack, setGeneratedTargetTrack] =
    useState<CareerTarget>("software_engineering");
  const [generatedTemplateFile, setGeneratedTemplateFile] =
    useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [providerMeta, setProviderMeta] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImportingProfile, setIsImportingProfile] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveGeneration, setSaveGeneration] = useState(false);
  const hasTrackedManualInput = useRef(false);

  const characterMessage = useMemo(() => {
    if (!resumeText.length) return "Paste or upload 200-5,000 characters";
    if (resumeText.length < MIN_RESUME_LENGTH) {
      return `${MIN_RESUME_LENGTH - resumeText.length} more characters needed`;
    }
    if (resumeText.length > MAX_RESUME_LENGTH) {
      return `${resumeText.length - MAX_RESUME_LENGTH} characters over limit`;
    }
    return `${resumeText.length.toLocaleString()} / ${MAX_RESUME_LENGTH.toLocaleString()}`;
  }, [resumeText]);

  const canGenerate =
    resumeText.trim().length >= MIN_RESUME_LENGTH &&
    resumeText.trim().length <= MAX_RESUME_LENGTH &&
    !isLoading &&
    !isExtracting &&
    !isImportingProfile &&
    !isAnalyzingTemplate &&
    (templateId !== "uploaded-template" ||
      Boolean(uploadedTemplateSpec && customTemplateId));

  async function generateResume(trigger: "generate" | "regenerate" = "generate") {
    if (!canGenerate) {
      setError("Paste or upload a resume between 200 and 5,000 characters first.");
      return;
    }

    const startedAt = performance.now();
    trackEvent("resume_generation_started", {
      trigger,
      plan,
      target_track: targetTrack,
      template_id: templateId,
      tone,
      save_generation: saveGeneration,
    });
    setIsLoading(true);
    setError(null);
    setCopied(false);
    setExportError(null);
    setQualityWarnings([]);

    try {
      const response = await fetch("/api/resume/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          targetTrack,
          templateId,
          customTemplateId:
            templateId === "uploaded-template" ? customTemplateId : undefined,
          tone,
          saveGeneration,
        }),
      });

      const result = (await response.json()) as RewriteResponse;

      if (!result.success) {
        trackEvent("resume_generation_failed", {
          trigger,
          plan,
          target_track: targetTrack,
          template_id: templateId,
          tone,
          error_code: result.error.code,
          http_status: response.status,
          duration_ms: Math.round(performance.now() - startedAt),
        });
        setError(result.error.message);
        return;
      }

      trackEvent("resume_generation_succeeded", {
        trigger,
        plan,
        target_track: targetTrack,
        template_id: templateId,
        tone,
        provider: result.data.provider,
        model: result.data.model,
        save_generation: saveGeneration,
        suggestion_count: result.data.suggestions.length,
        warning_count: result.data.qualityWarnings.length,
        duration_ms: Math.round(performance.now() - startedAt),
      });
      setRewrittenResume(result.data.rewrittenResume);
      setStructuredResume(result.data.structuredResume);
      setGeneratedTemplateId(templateId);
      setGeneratedTargetTrack(targetTrack);
      setGeneratedTemplateFile(
        templateId === "uploaded-template" ? uploadedTemplateFile : null,
      );
      setSuggestions(result.data.suggestions);
      setQualityWarnings(result.data.qualityWarnings);
      setProviderMeta(`${result.data.provider} / ${result.data.model}`);
    } catch {
      trackEvent("resume_generation_failed", {
        trigger,
        plan,
        target_track: targetTrack,
        template_id: templateId,
        tone,
        error_code: "NETWORK_ERROR",
        duration_ms: Math.round(performance.now() - startedAt),
      });
      setError("Could not rewrite the resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyResult() {
    if (!rewrittenResume) return;

    await navigator.clipboard.writeText(rewrittenResume);
    trackEvent("resume_result_copied", {
      plan,
      target_track: generatedTargetTrack,
      template_id: generatedTemplateId,
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="app-shell">
      <header className="nav app-nav">
        <Link className="brand" href="/">
          <BrandMark priority />
          <span>Zesume</span>
        </Link>
        <nav className="nav-links" aria-label="App navigation">
          <Link href="/">
            <ArrowLeft size={16} aria-hidden="true" /> Home
          </Link>
          <Link href="/pricing">Pricing</Link>
          {authSlot}
        </nav>
      </header>

      <section className="app-main">
        <div className="app-header">
          <div>
            <div className="eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              Zesume Studio
            </div>
            <h1>Your resume, but actually tailored.</h1>
            <p>
              A focused workspace for turning one student resume into
              career-ready versions for SWE, Quant, and Finance applications.
            </p>
          </div>
          <div className="app-header-side">
            <div className="flow-card">
              <span><FileUp size={16} aria-hidden="true" /> Import</span>
              <span><Wand2 size={16} aria-hidden="true" /> Rewrite</span>
              <span><Download size={16} aria-hidden="true" /> Export</span>
            </div>
            <button
              className="button button-primary"
              disabled={!canGenerate}
              onClick={() => void generateResume("generate")}
              type="button"
            >
              {isLoading ? (
                <Loader2 className="spin" size={16} aria-hidden="true" />
              ) : (
                <Sparkles size={16} aria-hidden="true" />
              )}
              {isLoading ? "Rewriting" : "Generate"}
            </button>
          </div>
        </div>

        <div className="workspace">
          <section className="panel input-panel" aria-label="Resume input">
            <ResumeUploader
              canImportFromProfile={canImportFromProfile}
              extractError={extractError}
              isExtracting={isExtracting}
              isImportingProfile={isImportingProfile}
              onExtractedText={(text, fileName) => {
                setResumeText(text);
                setUploadedFileName(fileName);
                setExtractError(null);
                setError(null);
                setQualityWarnings([]);
              }}
              onExtractErrorChange={setExtractError}
              onExtractingChange={setIsExtracting}
              onProfileImportingChange={setIsImportingProfile}
              plan={plan}
              uploadedFileName={uploadedFileName}
            />

            <ResumeInput
              characterMessage={characterMessage}
              maxLength={MAX_RESUME_LENGTH}
              onChange={(value) => {
                if (!hasTrackedManualInput.current && value.trim()) {
                  hasTrackedManualInput.current = true;
                  trackEvent("resume_input_started", {
                    source: "manual",
                    plan,
                  });
                }
                setResumeText(value);
                setError(null);
                setQualityWarnings([]);
              }}
              value={resumeText}
            />

            <CareerTargetSelector
              onChange={(nextTargetTrack) => {
                setTargetTrack(nextTargetTrack);
                trackEvent("career_target_selected", {
                  target_track: nextTargetTrack,
                  plan,
                });
              }}
              value={targetTrack}
            />

            <ResumeTemplateSelector
              analysisError={templateAnalysisError}
              isAnalyzing={isAnalyzingTemplate}
              onAnalysisEnd={() => setIsAnalyzingTemplate(false)}
              onAnalysisError={(message) => {
                setTemplateAnalysisError(message);
                setError(null);
              }}
              onAnalysisStart={() => {
                setIsAnalyzingTemplate(true);
                setTemplateAnalysisError(null);
                setError(null);
              }}
              onAnalysisSuccess={(templateSpec, analyzedTemplateId, fileName, file) => {
                setUploadedTemplateSpec(templateSpec);
                setCustomTemplateId(analyzedTemplateId);
                setUploadedTemplateFileName(fileName);
                setUploadedTemplateFile(file);
                setTemplateId("uploaded-template");
                setTemplateAnalysisError(null);
                setQualityWarnings([]);
              }}
              onChange={(nextTemplateId) => {
                setTemplateId(nextTemplateId);
                trackEvent("resume_template_selected", {
                  template_id: nextTemplateId,
                  plan,
                });
                setError(null);
                setQualityWarnings([]);
              }}
              uploadedTemplateFileName={uploadedTemplateFileName}
              uploadedTemplateSpec={uploadedTemplateSpec}
              canUploadTemplate={canUploadTemplate}
              plan={plan}
              value={templateId}
            />

            <ToneSelector
              onChange={(nextTone) => {
                setTone(nextTone);
                trackEvent("resume_tone_selected", {
                  tone: nextTone,
                  plan,
                });
              }}
              value={tone}
            />

            {plan !== "GUEST" ? (
              <label className="save-history-option">
                <input
                  checked={saveGeneration}
                  onChange={(event) => {
                    setSaveGeneration(event.target.checked);
                    trackEvent("save_history_toggled", {
                      enabled: event.target.checked,
                      plan,
                    });
                  }}
                  type="checkbox"
                />
                <span>
                  <strong>Save to resume history</strong>
                  <small>Keep this result in your Dashboard for later TXT or DOCX download.</small>
                </span>
              </label>
            ) : null}

            {error ? <div className="error">{error}</div> : null}

            <div className="output-actions">
              <button
                className="button button-primary button-full"
                disabled={!canGenerate}
                onClick={() => void generateResume("generate")}
                type="button"
              >
                {isLoading ? (
                  <Loader2 className="spin" size={16} aria-hidden="true" />
                ) : (
                  <Sparkles size={16} aria-hidden="true" />
                )}
                {isLoading ? "Rewriting" : "Generate tailored resume"}
              </button>
            </div>
          </section>

          <GeneratedOutput
            copied={copied}
            exportError={exportError}
            isExporting={isExporting}
            isLoading={isLoading}
            onCopy={() => void copyResult()}
            onExportErrorChange={setExportError}
            onExportingChange={setIsExporting}
            onRegenerate={() => void generateResume("regenerate")}
            providerMeta={providerMeta}
            rewrittenResume={rewrittenResume}
            structuredResume={structuredResume}
            qualityWarnings={qualityWarnings}
            suggestions={suggestions}
            targetTrack={rewrittenResume ? generatedTargetTrack : targetTrack}
            templateId={rewrittenResume ? generatedTemplateId : templateId}
            uploadedTemplateFile={
              rewrittenResume ? generatedTemplateFile : uploadedTemplateFile
            }
          />
        </div>
      </section>
    </main>
  );
}
