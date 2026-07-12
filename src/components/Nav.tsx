import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";

export async function Nav() {
  return (
    <header className="nav">
      <Link className="brand" href="/">
        <span className="brand-mark">Z</span>
        <span>Zesume</span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/app">Rewriter</Link>
        <Link href="/pricing">Pricing</Link>
        <UserMenu />
        <Link className="button button-primary" href="/app">
          Try Zesume
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}
