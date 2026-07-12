import Link from "next/link";
import { LayoutDashboard, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";
import type { CurrentUser } from "@/lib/auth/current-user";

type UserMenuProps = {
  redirectToAfterSignOut?: string;
  user?: CurrentUser | null;
};

function userLabel(name?: string | null, email?: string | null) {
  return name?.trim() || email?.trim() || "Zesume user";
}

export async function UserMenu({
  redirectToAfterSignOut = "/",
  user: providedUser,
}: UserMenuProps) {
  const user = providedUser === undefined ? (await auth())?.user : providedUser;

  if (!user?.email) {
    return <SignInButton />;
  }

  return (
    <div className="auth-user">
      <span className="auth-avatar" aria-hidden="true">
        {user.image ? (
          <img alt="" height={32} src={user.image} width={32} />
        ) : (
          <UserRound size={16} />
        )}
      </span>
      <span className="auth-user-copy">
        <strong>{userLabel(user.name, user.email)}</strong>
        <small>{user.email}</small>
      </span>
      <Link
        aria-label="Dashboard"
        className="auth-dashboard-link"
        href="/dashboard"
        title="Dashboard"
      >
        <LayoutDashboard size={16} />
      </Link>
      <SignOutButton redirectTo={redirectToAfterSignOut} />
    </div>
  );
}
