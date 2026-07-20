import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import {
  constantTimeEqual,
  EMAIL_CODE_COOLDOWN_MS,
  EMAIL_CODE_MAX_ATTEMPTS,
  EMAIL_CODE_TTL_MS,
  generateEmailCode,
  normalizeEmail,
  normalizeEmailCode,
} from "./email-code-core";

const encoder = new TextEncoder();

function assertEmailLoginConfigured() {
  if (!isDatabaseConfigured() || process.env.AUTH_DATABASE_ENABLED !== "true") {
    throw new Error("EMAIL_LOGIN_DATABASE_NOT_CONFIGURED");
  }

  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error("EMAIL_LOGIN_SECRET_NOT_CONFIGURED");
  }
}

async function hmac(value: string) {
  const secret = process.env.AUTH_EMAIL_CODE_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("EMAIL_LOGIN_SECRET_NOT_CONFIGURED");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function identifierHash(email: string) {
  return hmac(`email-login:identifier:${email}`);
}

async function codeHash(email: string, code: string) {
  return hmac(`email-login:code:${email}:${code}`);
}

async function sendEmailCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${code} is your Zesume sign-in code`,
      text: `Your Zesume sign-in code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      html: `
        <div style="background:#f5f8f6;padding:32px 16px;font-family:Arial,sans-serif;color:#14161c">
          <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #dce4df;border-top:5px solid #2f9e72;border-radius:8px;padding:28px">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#2f9e72">ZESUME</p>
            <h1 style="margin:0 0 16px;font-size:24px">Your sign-in code</h1>
            <p style="margin:0 0 20px;color:#52605a;line-height:1.6">Enter this code on Zesume. It expires in 10 minutes.</p>
            <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#eef8f2;border-radius:8px;padding:18px;text-align:center">${code}</div>
            <p style="margin:20px 0 0;font-size:12px;color:#718078;line-height:1.5">If you did not request this code, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`EMAIL_DELIVERY_FAILED_${response.status}`);
  }
}

export type RequestEmailCodeResult =
  | { ok: true; retryAfterSeconds: number }
  | { ok: false; code: "COOLDOWN"; retryAfterSeconds: number };

export async function requestEmailLoginCode(rawEmail: unknown): Promise<RequestEmailCodeResult> {
  assertEmailLoginConfigured();
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("INVALID_EMAIL");

  const now = new Date();
  const hash = await identifierHash(email);
  await prisma.emailLoginCode.deleteMany({
    where: {
      identifierHash: hash,
      OR: [{ expiresAt: { lte: now } }, { consumedAt: { not: null } }],
    },
  });
  const cooldownStart = new Date(now.getTime() - EMAIL_CODE_COOLDOWN_MS);
  const latest = await prisma.emailLoginCode.findFirst({
    where: {
      identifierHash: hash,
      createdAt: { gt: cooldownStart },
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (latest) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((latest.createdAt.getTime() + EMAIL_CODE_COOLDOWN_MS - now.getTime()) / 1000),
    );
    return { ok: false, code: "COOLDOWN", retryAfterSeconds };
  }

  const code = generateEmailCode();
  const record = await prisma.emailLoginCode.create({
    data: {
      identifierHash: hash,
      codeHash: await codeHash(email, code),
      expiresAt: new Date(now.getTime() + EMAIL_CODE_TTL_MS),
    },
    select: { id: true },
  });

  try {
    await sendEmailCode(email, code);
  } catch (error) {
    await prisma.emailLoginCode.deleteMany({ where: { id: record.id } });
    throw error;
  }

  return { ok: true, retryAfterSeconds: EMAIL_CODE_COOLDOWN_MS / 1000 };
}

export async function authorizeEmailLogin(rawEmail: unknown, rawCode: unknown) {
  assertEmailLoginConfigured();
  const email = normalizeEmail(rawEmail);
  const code = normalizeEmailCode(rawCode);
  if (!email || !code) return null;

  const now = new Date();
  const hash = await identifierHash(email);
  const record = await prisma.emailLoginCode.findFirst({
    where: {
      identifierHash: hash,
      consumedAt: null,
      expiresAt: { gt: now },
      attempts: { lt: EMAIL_CODE_MAX_ATTEMPTS },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  const expectedHash = await codeHash(email, code);
  if (!constantTimeEqual(record.codeHash, expectedHash)) {
    await prisma.emailLoginCode.updateMany({
      where: { id: record.id, consumedAt: null, attempts: { lt: EMAIL_CODE_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }

  return prisma.$transaction(async (transaction) => {
    const consumed = await transaction.emailLoginCode.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: EMAIL_CODE_MAX_ATTEMPTS },
      },
      data: { consumedAt: now },
    });

    if (consumed.count !== 1) return null;

    return transaction.user.upsert({
      where: { email },
      update: { emailVerified: now },
      create: { email, emailVerified: now },
    });
  });
}
