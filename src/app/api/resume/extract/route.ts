import { NextResponse } from "next/server";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIN_EXTRACTED_TEXT_LENGTH = 20;

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index === -1 ? "" : fileName.slice(index).toLowerCase();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("NO_FILE", "Please upload a .txt or .docx file.");
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        "FILE_TOO_LARGE",
        "File is too large. Please upload a file under 2MB.",
      );
    }

    const extension = getExtension(file.name);

    if (extension === ".pdf" || file.type === "application/pdf") {
      return errorResponse(
        "UNSUPPORTED_FILE_TYPE",
        "PDF upload is not supported in v1.1. Please upload a .txt or .docx file.",
      );
    }

    if (extension !== ".txt" && extension !== ".docx") {
      return errorResponse(
        "UNSUPPORTED_FILE_TYPE",
        "Unsupported file type. Please upload a .txt or .docx file.",
      );
    }

    let extractedText = "";

    try {
      if (extension === ".txt") {
        extractedText = await file.text();
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      }
    } catch {
      return errorResponse(
        "EXTRACTION_FAILED",
        "Could not extract text from this file. Please try another .txt or .docx file.",
      );
    }

    const normalizedText = extractedText.replace(/\r\n/g, "\n").trim();

    if (normalizedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
      return errorResponse(
        "EXTRACTED_TEXT_TOO_SHORT",
        "The extracted text is too short. Please upload a more complete resume.",
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        extractedText: normalizedText,
        fileName: file.name,
        characterCount: normalizedText.length,
      },
    });
  } catch {
    return errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong.", 500);
  }
}
