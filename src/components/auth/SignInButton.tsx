import { LogIn } from "lucide-react";
import { signIn } from "@/auth";

type SignInButtonProps = {
  redirectTo?: string;
  className?: string;
  label?: string;
};

export function SignInButton({
  redirectTo = "/app",
  className = "button button-secondary",
  label = "Sign in",
}: SignInButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo });
      }}
    >
      <button className={className} type="submit">
        <LogIn size={16} aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}
