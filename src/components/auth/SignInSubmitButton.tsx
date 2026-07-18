"use client";

import { LogIn } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";

type SignInSubmitButtonProps = {
  className: string;
  label: string;
  redirectTo: string;
};

export function SignInSubmitButton({
  className,
  label,
  redirectTo,
}: SignInSubmitButtonProps) {
  return (
    <button
      className={className}
      onClick={() =>
        trackEvent("login_started", {
          method: "google",
          redirect_to: redirectTo,
        })
      }
      type="submit"
    >
      <LogIn size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

