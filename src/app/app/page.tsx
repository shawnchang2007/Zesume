"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileUp, Loader2, Sparkles, Wand2 } from "lucide-react";
import { GeneratedOutput } from "@/components/resume/GeneratedOutput";
import { ResumeInput } from "@/components/resume/ResumeInput";
import { ResumeUploader } from "@/components/resume/ResumeUploader";
import { TemplateSelector } from "@/components/resume/TemplateSelector";
import { ToneSelector } from "@/components/resume/ToneSelector";
import type { TargetTemplate, Tone } from "@/lib/ai/types";

const MIN_RESUME_LENGTH = 200;
const MAX_RESUME_LENGTH = 5000;

type RewriteResponse =
  | {
      success: true;
      data: {
        rewrittenResume: string;
        suggestions: string[];
        qualityWarnings: string[];
        provider: string;
        model: string;
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

export default function AppPage() {
  const [resumeText, setResumeText] = useState("");
  const [targetTemplate, setTargetTemplate] =
    useState<TargetTemplate>("software_engineering");
  const [tone, setTone] = useState<Tone>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [providerMeta, setProviderMeta] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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
    !isExtracting;

  async function generateResume() {
    if (!canGenerate) {
      setError("Paste or upload a resume between 200 and 5,000 characters first.");
      return;
    }

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
          targetTemplate,
          tone,
        }),
      });

      const result = (await response.json()) as RewriteResponse;

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setRewrittenResume(result.data.rewrittenResume);
      setSuggestions(result.data.suggestions);
      setQualityWarnings(result.data.qualityWarnings);
      setProviderMeta(`${result.data.provider} / ${result.data.model}`);
    } catch {
      setError("Could not rewrite the resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyResult() {
    if (!rewrittenResume) return;

    await navigator.clipboard.writeText(rewrittenResume);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="app-shell">
      <header className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">Z</span>
          <span>Zesume</span>
        </Link>
        <nav className="nav-links" aria-label="App navigation">
          <Link href="/">
            <ArrowLeft size={16} aria-hidden="true" /> Home
          </Link>
          <Link href="/pricing">Pricing</Link>
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
              onClick={() => void generateResume()}
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
              extractError={extractError}
              isExtracting={isExtracting}
              onExtractedText={(text, fileName) => {
                setResumeText(text);
                setUploadedFileName(fileName);
                setExtractError(null);
                setError(null);
                setQualityWarnings([]);
              }}
              onExtractErrorChange={setExtractError}
              onExtractingChange={setIsExtracting}
              uploadedFileName={uploadedFileName}
            />

            <ResumeInput
              characterMessage={characterMessage}
              maxLength={MAX_RESUME_LENGTH}
              onChange={(value) => {
                setResumeText(value);
                setError(null);
                setQualityWarnings([]);
              }}
              value={resumeText}
            />

            <TemplateSelector
              onChange={setTargetTemplate}
              value={targetTemplate}
            />

            <ToneSelector onChange={setTone} value={tone} />

            {error ? <div className="error">{error}</div> : null}

            <div className="output-actions">
              <button
                className="button button-primary button-full"
                disabled={!canGenerate}
                onClick={() => void generateResume()}
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
            onRegenerate={() => void generateResume()}
            providerMeta={providerMeta}
            rewrittenResume={rewrittenResume}
            qualityWarnings={qualityWarnings}
            suggestions={suggestions}
            targetTemplate={targetTemplate}
          />
        </div>
      </section>
    </main>
  );
}
