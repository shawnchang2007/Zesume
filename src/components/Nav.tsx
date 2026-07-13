import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { UserMenu } from "@/components/auth/UserMenu";

export async function Nav() {
  return (
    <header className="nav">
      <Link className="brand" href="/">
        <BrandMark priority />
        <span>Zesume</span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/app">Rewriter</Link>
        <Link href="/resources">Resources</Link>
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
