"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Loader2, Mail, RotateCcw } from "lucide-react";
import { signIn } from "next-auth/react";
import { trackEvent } from "@/lib/analytics/client";

type EmailCodeSignInProps = {
  redirectTo: string;
};

type RequestPayload = {
  ok?: boolean;
  retryAfterSeconds?: number;
  error?: { code?: string; message?: string };
};

export function EmailCodeSignIn({ redirectTo }: EmailCodeSignInProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(
      () => setCooldown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function requestCode() {
    setIsRequesting(true);
    setError(null);
    setMessage(null);
    trackEvent("login_code_requested", { method: "email_code" });

    try {
      const response = await fetch("/api/auth/email-code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as RequestPayload;

      if (!response.ok) {
        if (payload.error?.code === "COOLDOWN" && payload.retryAfterSeconds) {
          setCodeSent(true);
          setCooldown(payload.retryAfterSeconds);
        }
        throw new Error(payload.error?.message || "We could not send a sign-in code.");
      }

      setCodeSent(true);
      setCode("");
      setCooldown(payload.retryAfterSeconds ?? 60);
      setMessage("A 6-digit code has been sent. Check your inbox and spam folder.");
      trackEvent("login_code_sent", { method: "email_code" });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not send a sign-in code.",
      );
      trackEvent("login_code_failed", { method: "email_code" });
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsVerifying(true);
    setError(null);
    trackEvent("login_started", { method: "email_code", redirect_to: redirectTo });

    try {
      const result = await signIn("email-code", {
        email,
        code,
        redirect: false,
        redirectTo,
      });

      if (!result.ok || result.error) {
        throw new Error("That code is incorrect or has expired. Request a new code and try again.");
      }

      trackEvent("login_succeeded", { method: "email_code" });
      window.location.assign(result.url || redirectTo);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "We could not verify that code.",
      );
      trackEvent("login_failed", { method: "email_code" });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="auth-email-login">
      {!codeSent ? (
        <form className="auth-email-form" onSubmit={handleRequest}>
          <label htmlFor="auth-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input
              autoComplete="email"
              id="auth-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </div>
          <button className="button button-secondary auth-email-button" disabled={isRequesting} type="submit">
            {isRequesting ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
            {isRequesting ? "Sending code..." : "Continue with email"}
          </button>
        </form>
      ) : (
        <form className="auth-email-form" onSubmit={handleVerify}>
          <div className="auth-code-heading">
            <div>
              <span>Code sent to</span>
              <strong>{email}</strong>
            </div>
            <button
              className="auth-change-email"
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setError(null);
                setMessage(null);
              }}
              type="button"
            >
              Change
            </button>
          </div>
          <label htmlFor="auth-code">Verification code</label>
          <input
            autoComplete="one-time-code"
            className="auth-code-input"
            id="auth-code"
            inputMode="numeric"
            maxLength={6}
            name="code"
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            pattern="[0-9]{6}"
            placeholder="000000"
            required
            value={code}
          />
          <button className="button button-primary auth-email-button" disabled={isVerifying || code.length !== 6} type="submit">
            {isVerifying ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
            {isVerifying ? "Signing in..." : "Sign in"}
          </button>
          <button
            className="auth-resend"
            disabled={isRequesting || cooldown > 0}
            onClick={requestCode}
            type="button"
          >
            <RotateCcw size={14} aria-hidden="true" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      )}

      <div aria-live="polite">
        {message ? <p className="auth-form-message success">{message}</p> : null}
        {error ? <p className="auth-form-message error">{error}</p> : null}
      </div>
    </div>
  );
}
