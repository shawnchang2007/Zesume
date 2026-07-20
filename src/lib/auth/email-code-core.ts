const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_CODE_LENGTH = 6;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;
export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_CODE_COOLDOWN_MS = 60 * 1000;

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return null;
  }

  return email;
}

export function normalizeEmailCode(value: unknown) {
  if (typeof value !== "string") return null;

  const code = value.replace(/\s/g, "");
  return new RegExp(`^\\d{${EMAIL_CODE_LENGTH}}$`).test(code) ? code : null;
}

export function safeAuthRedirect(value: unknown, fallback = "/app") {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

export function generateEmailCode() {
  const range = 10 ** EMAIL_CODE_LENGTH;
  const maximum = Math.floor(0x1_0000_0000 / range) * range;
  const values = new Uint32Array(1);

  do {
    crypto.getRandomValues(values);
  } while (values[0] >= maximum);

  return (values[0] % range).toString().padStart(EMAIL_CODE_LENGTH, "0");
}

export function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}
