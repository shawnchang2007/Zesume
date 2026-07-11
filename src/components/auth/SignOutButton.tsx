import { LogOut } from "lucide-react";
import { signOut } from "@/auth";

type SignOutButtonProps = {
  redirectTo?: string;
};

export function SignOutButton({ redirectTo = "/" }: SignOutButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo });
      }}
    >
      <button
        aria-label="Sign out"
        className="auth-sign-out"
        title="Sign out"
        type="submit"
      >
        <LogOut size={16} aria-hidden="true" />
      </button>
    </form>
  );
}
