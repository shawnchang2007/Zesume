type QualityValidationInput = {
  sourceText: string;
  rewrittenResume: string;
};

const vagueTerms = [
  "cutting-edge",
  "world-class",
  "revolutionary",
  "impactful solutions",
  "various tasks",
  "game-changing",
  "best-in-class",
];

const suspiciousNumberPatterns = [
  /\b\d+(?:\.\d+)?\s*%/g,
  /[$£€]\s?\d[\d,.]*/g,
  /\b\d+(?:\.\d+)?\s?(?:k|m|bn|million|billion|users|customers|clients|downloads|requests|transactions|bps|ms|seconds|minutes|hours)\b/gi,
  /\b(?:top|ranked|ranking|rank)\s*\d+\b/gi,
  /\b\d+(?:\.\d+)?x\b/gi,
];

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function wordCount(text: string) {
  return text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g)?.length ?? 0;
}

function extractNumbers(text: string) {
  return new Set(text.match(/\d+(?:\.\d+)?/g) ?? []);
}

function extractSuspiciousNumberClaims(text: string) {
  return suspiciousNumberPatterns.flatMap((pattern) => text.match(pattern) ?? []);
}

function getBulletLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line));
}

export function validateRewrittenResumeQuality({
  sourceText,
  rewrittenResume,
}: QualityValidationInput) {
  const warnings: string[] = [];
  const bulletLines = getBulletLines(rewrittenResume);
  const longBullets = bulletLines.filter((line) =>
    wordCount(line.replace(/^[-*•]\s+/, "")) > 30,
  );

  if (longBullets.length > 0) {
    warnings.push(
      "Some bullet points are longer than 30 words. Consider tightening them for resume readability.",
    );
  }

  if (/\b(i|we|my|our|ours|me)\b/i.test(rewrittenResume) || /\bus\b/.test(rewrittenResume)) {
    warnings.push(
      "First-person wording was detected. Resume bullets should avoid I, we, my, and our.",
    );
  }

  const lowerResume = rewrittenResume.toLowerCase();
  const detectedVagueTerms = vagueTerms.filter((term) =>
    lowerResume.includes(term),
  );

  if (detectedVagueTerms.length > 0) {
    warnings.push(
      `Vague or inflated wording detected: ${detectedVagueTerms.join(", ")}. Replace with specific, factual wording.`,
    );
  }

  const sourceNumbers = extractNumbers(sourceText);
  const suspiciousClaims = extractSuspiciousNumberClaims(rewrittenResume);
  const unsupportedClaims = suspiciousClaims.filter((claim) => {
    const claimNumbers = claim.match(/\d+(?:\.\d+)?/g) ?? [];
    return claimNumbers.some((number) => !sourceNumbers.has(number));
  });

  if (unsupportedClaims.length > 0) {
    warnings.push(
      "Potentially unsupported numbers or metrics were detected. Verify percentages, money amounts, rankings, user counts, and performance gains against the original resume.",
    );
  }

  return unique(warnings);
}

export function mergeQualityWarnings(...warningGroups: Array<string[] | undefined>) {
  return unique(
    warningGroups
      .flatMap((warnings) => warnings ?? [])
      .filter((warning) => typeof warning === "string" && warning.trim().length > 0)
      .map((warning) => warning.trim()),
  );
}
