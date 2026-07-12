import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { CareerMemoryManager } from "@/components/dashboard/CareerMemoryManager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";
import { listCareerItems } from "@/lib/career-items/service";

export default async function CareerMemoryPage() {
  const user = await getCurrentUser();
  const access = await getCurrentAccess(user, { includeUsage: false });

  if (!user) {
    return <main className="dashboard-shell"><section className="dashboard-signin"><LockKeyhole size={24} /><h1>Sign in to open Career Memory.</h1><Link className="button button-primary" href="/sign-in?callbackUrl=/dashboard/memory">Continue</Link></section></main>;
  }

  const enabled = canUseFeature(access, "CAREER_EXPERIENCE") && access.databaseBacked && access.userId;
  const initialItems = enabled
    ? JSON.parse(JSON.stringify(await listCareerItems(access.userId!)))
    : [];

  return (
    <main className="dashboard-shell">
      <header className="nav dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark">Z</span><span>Zesume</span></Link>
        <nav className="nav-links"><Link href="/dashboard"><ArrowLeft size={16} /> Dashboard</Link><Link href="/app">Resume Studio</Link><UserMenu redirectToAfterSignOut="/" user={user} /></nav>
      </header>
      <section className="dashboard-main memory-page">
        <div className="dashboard-account-header"><div><p className="eyebrow">Pro workspace</p><h1>Career Memory</h1><p>Maintain the facts Zesume may use as supporting context.</p></div><span className="gold-tier">PRO</span></div>
        {enabled ? <CareerMemoryManager initialItems={initialItems} /> : <section className="memory-paywall"><LockKeyhole className="gold-lock" size={24} /><h2>Career Memory is available on Pro.</h2><p>Create, import, edit, exclude, and delete reusable career facts.</p><Link className="button button-primary" href="/pricing">Upgrade to Pro</Link></section>}
      </section>
    </main>
  );
}
