"use client";

import { Download, FileText } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";

type HistoryDownloadButtonsProps = {
  generationId: string;
  hasDownload: boolean;
};

export function HistoryDownloadButtons({
  generationId,
  hasDownload,
}: HistoryDownloadButtonsProps) {
  if (!hasDownload) {
    return <span className="dashboard-history-unavailable">Not retained</span>;
  }

  const downloadPath = `/api/resume/history/${encodeURIComponent(generationId)}/download`;

  return (
    <div className="dashboard-history-actions">
      <a
        className="history-download-button"
        href={`${downloadPath}?format=txt`}
        onClick={() =>
          trackEvent("history_download_started", { format: "txt" })
        }
        title="Download TXT"
      >
        <FileText size={14} aria-hidden="true" />
        TXT
      </a>
      <a
        className="history-download-button"
        href={`${downloadPath}?format=docx`}
        onClick={() =>
          trackEvent("history_download_started", { format: "docx" })
        }
        title="Download DOCX"
      >
        <Download size={14} aria-hidden="true" />
        DOCX
      </a>
    </div>
  );
}
