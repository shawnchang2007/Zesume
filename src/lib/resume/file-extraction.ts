import mammoth from "mammoth";
import JSZip from "jszip";

export const MAX_RESUME_FILE_SIZE = 2 * 1024 * 1024;
export const MAX_DOCX_ENTRY_COUNT = 500;
export const MAX_DOCX_UNCOMPRESSED_SIZE = 20 * 1024 * 1024;

export type SupportedResumeFileExtension = ".txt" | ".docx";

export function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index === -1 ? "" : fileName.slice(index).toLowerCase();
}

export async function extractTextFromResumeFile(
  file: File,
  extension: SupportedResumeFileExtension,
) {
  if (extension === ".txt") {
    return file.text();
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const uncompressedSize = entries.reduce((total, entry) => {
    const size = (
      entry as typeof entry & { _data?: { uncompressedSize?: number } }
    )._data?.uncompressedSize;
    return total + (typeof size === "number" ? size : 0);
  }, 0);

  if (
    entries.length > MAX_DOCX_ENTRY_COUNT ||
    uncompressedSize > MAX_DOCX_UNCOMPRESSED_SIZE
  ) {
    throw new Error("DOCX_LIMIT_EXCEEDED");
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}
