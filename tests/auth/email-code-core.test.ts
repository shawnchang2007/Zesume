import { describe, expect, it } from "vitest";
import {
  constantTimeEqual,
  generateEmailCode,
  normalizeEmail,
  normalizeEmailCode,
  safeAuthRedirect,
} from "@/lib/auth/email-code-core";

describe("email code authentication helpers", () => {
  it("normalizes valid email addresses and rejects invalid input", () => {
    expect(normalizeEmail("  Student@Example.COM ")).toBe("student@example.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it("accepts only six-digit verification codes", () => {
    expect(normalizeEmailCode(" 123456 ")).toBe("123456");
    expect(normalizeEmailCode("12345")).toBeNull();
    expect(normalizeEmailCode("12345a")).toBeNull();
  });

  it("generates fixed-width numeric codes", () => {
    for (let index = 0; index < 20; index += 1) {
      expect(generateEmailCode()).toMatch(/^\d{6}$/);
    }
  });

  it("allows only same-origin relative redirects", () => {
    expect(safeAuthRedirect("/dashboard?tab=history")).toBe("/dashboard?tab=history");
    expect(safeAuthRedirect("https://attacker.example")).toBe("/app");
    expect(safeAuthRedirect("//attacker.example")).toBe("/app");
  });

  it("compares hashes without an early length shortcut", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "ab")).toBe(false);
  });
});
