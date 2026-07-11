import mammoth from "mammoth";

export const MAX_RESUME_FILE_SIZE = 2 * 1024 * 1024;

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
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}
