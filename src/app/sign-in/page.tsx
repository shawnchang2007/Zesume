import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth/SignInButton";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/app");
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/">
          <span className="brand-mark">Z</span>
          <span>Zesume</span>
        </Link>
        <Link className="auth-back" href="/app">
          <ArrowLeft size={16} aria-hidden="true" />
          Continue without signing in
        </Link>
      </header>

      <section className="auth-panel" aria-labelledby="sign-in-title">
        <span className="auth-panel-icon" aria-hidden="true">
          <ShieldCheck size={22} />
        </span>
        <p className="eyebrow">Your Zesume account</p>
        <h1 id="sign-in-title">Sign in to Zesume</h1>
        <p className="auth-panel-copy">
          Keep your identity ready for saved resume versions, profile memory,
          and generation history as those features arrive.
        </p>

        <SignInButton
          className="button button-primary auth-google-button"
          label="Continue with Google"
        />

        <div className="auth-benefits" aria-label="Account benefits">
          <span><CheckCircle2 size={15} aria-hidden="true" /> Basic rewriting stays available without an account</span>
          <span><CheckCircle2 size={15} aria-hidden="true" /> Google authentication is handled securely by Auth.js</span>
        </div>

        <p className="auth-privacy">
          Zesume receives your Google name, email, and profile image. Resume
          text is not automatically saved when you sign in.
        </p>
      </section>
    </main>
  );
}
