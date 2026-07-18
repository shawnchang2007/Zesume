import { signIn } from "@/auth";
import { SignInSubmitButton } from "./SignInSubmitButton";

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
      <SignInSubmitButton
        className={className}
        label={label}
        redirectTo={redirectTo}
      />
    </form>
  );
}
