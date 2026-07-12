import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  LockKeyhole,
  Sparkles,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";
import { prisma } from "@/lib/db/prisma";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { BasicProfileForm } from "@/components/dashboard/BasicProfileForm";
import { HistoryDownloadButtons } from "@/components/dashboard/HistoryDownloadButtons";
import type { BasicProfileInput } from "@/lib/profile/basic-profile";

function planLabel(plan: string) {
  return plan === "GUEST" ? "Guest" : plan[0] + plan.slice(1).toLowerCase();
}

async function loadDashboardData(userId: string, historyLimit: number) {
  try {
    const [profile, history] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.resumeGeneration.findMany({
        where: { userId, isSaved: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: historyLimit,
        select: {
          id: true,
          title: true,
          targetTemplate: true,
          rewrittenResume: true,
          createdAt: true,
        },
      }),
    ]);

    const basicProfile: BasicProfileInput | null = profile
      ? {
          fullName: profile.fullName,
          contactEmail: profile.contactEmail,
          phone: profile.phone,
          location: profile.location,
          school: profile.school,
          degree: profile.degree,
          major: profile.major,
          graduationYear: profile.graduationYear,
          linkedinUrl: profile.linkedinUrl,
          githubUrl: profile.githubUrl,
          portfolioUrl: profile.portfolioUrl,
          targetRoles: profile.targetRoles,
          targetLocations: profile.targetLocations,
        }
      : null;

    return {
      profile: basicProfile,
      history: history.map(({ rewrittenResume, ...generation }) => ({
        ...generation,
        hasDownload: Boolean(rewrittenResume?.trim()),
      })),
    };
  } catch {
    return { profile: null, history: [] };
  }
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const access = await getCurrentAccess(currentUser);

  if (!currentUser) {
    return (
      <main className="dashboard-shell">
        <header className="nav">
          <Link className="brand" href="/">
            <span className="brand-mark">Z</span>
            <span>Zesume</span>
          </Link>
        </header>
        <section className="dashboard-signin">
          <span className="dashboard-feature-icon"><UserRound size={20} /></span>
          <p className="eyebrow">Your Zesume workspace</p>
          <h1>Sign in to open your dashboard.</h1>
          <p>Manage your profile, usage, resume history, templates, and future Career Memory from one place.</p>
          <SignInButton redirectTo="/dashboard" label="Continue with Google" />
        </section>
      </main>
    );
  }

  const data = access.databaseBacked && access.userId
    ? await loadDashboardData(access.userId, access.limits.historyLimit)
    : { profile: null, history: [] };
  const careerOpen = canUseFeature(access, "CAREER_EXPERIENCE");
  const importOpen = canUseFeature(access, "PROFILE_IMPORT");
  const usagePercent = Math.min(
    100,
    Math.round((access.usage.used / access.usage.limit) * 100),
  );

  return (
    <main className="dashboard-shell">
      <header className="nav dashboard-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">Z</span>
          <span>Zesume</span>
        </Link>
        <nav className="nav-links" aria-label="Dashboard navigation">
          <Link href="/app">Resume Studio</Link>
          <Link href="/pricing">Pricing</Link>
          <UserMenu redirectToAfterSignOut="/" user={currentUser} />
        </nav>
      </header>

      <section className="dashboard-main">
        <div className="dashboard-account-header">
          <div>
            <p className="eyebrow">Account workspace</p>
            <h1>{currentUser.name?.trim() || "Your dashboard"}</h1>
            <p>{currentUser.email}</p>
          </div>
          <div className="dashboard-plan-badge">{planLabel(access.plan)}</div>
        </div>

        {!access.databaseBacked ? (
          <div className="dashboard-notice">
            Profile and history storage will activate when the production PostgreSQL database is connected. Authentication and resume tools remain available.
          </div>
        ) : null}

        <section className="dashboard-usage" aria-labelledby="usage-title">
          <div>
            <span className="dashboard-kicker">Plan and usage</span>
            <h2 id="usage-title">
              {access.usage.used} / {access.usage.limit} generations
            </h2>
            <p>
              {access.usage.remaining} remaining in the current billing period.
            </p>
          </div>
          <div className="usage-meter" aria-label={`${usagePercent}% used`}>
            <span style={{ width: `${usagePercent}%` }} />
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="dashboard-module dashboard-module-wide">
            <div className="dashboard-module-header">
              <div>
                <span className="dashboard-kicker">Basic Profile</span>
                <h2>Contact and education details</h2>
              </div>
              <UserRound size={20} aria-hidden="true" />
            </div>
            <p className="dashboard-module-copy">
              These fields may fill missing identity, contact, and education details. They never create projects, awards, skills, or results.
            </p>
            <BasicProfileForm
              enabled={access.databaseBacked}
              initialProfile={data.profile}
            />
          </section>

          <section className="dashboard-module">
            <div className="dashboard-module-header">
              <div>
                <span className="dashboard-kicker">Recent history</span>
                <h2>Latest resumes</h2>
              </div>
              <Clock3 size={20} aria-hidden="true" />
            </div>
            {data.history.length ? (
              <div className="dashboard-list">
                {data.history.map((generation) => (
                  <div className="dashboard-list-row" key={generation.id}>
                    <div className="dashboard-history-copy">
                      <strong>{generation.title || generation.targetTemplate}</strong>
                      <span>{generation.createdAt.toLocaleDateString("en-GB")}</span>
                    </div>
                    <HistoryDownloadButtons
                      generationId={generation.id}
                      hasDownload={generation.hasDownload}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-empty">Your generated resumes will appear here.</p>
            )}
            <small>Current plan retains the latest {access.limits.historyLimit}.</small>
          </section>

          <section className={`dashboard-module ${careerOpen ? "" : "dashboard-locked"}`}>
            <div className="dashboard-module-header">
              <div>
                <span className="dashboard-kicker">Career Experience</span>
                <h2>Reusable experience bank</h2>
              </div>
              {careerOpen ? <BriefcaseBusiness size={20} /> : <LockKeyhole className="gold-lock" size={20} />}
            </div>
            <div className="locked-content">
              <span className="gold-tier">PRO</span>
              <p>Save projects, internships, education, awards, and tailored bullet versions.</p>
              {careerOpen ? <Link className="button button-secondary" href="/dashboard/memory">Manage Career Memory</Link> : <Link className="button button-secondary" href="/pricing">Upgrade to Pro</Link>}
            </div>
          </section>

          <section className={`dashboard-module ${importOpen ? "" : "dashboard-locked"}`}>
            <div className="dashboard-module-header">
              <div>
                <span className="dashboard-kicker">Resume Import</span>
                <h2>Import to Career Profile</h2>
              </div>
              {importOpen ? <UploadCloud size={20} /> : <LockKeyhole className="gold-lock" size={20} />}
            </div>
            <div className="locked-content">
              <span className="gold-tier">PRO</span>
              <p>Import your Basic Profile and Career Experience directly into Resume Studio.</p>
              {importOpen ? (
                <Link className="button button-secondary" href="/dashboard/memory#import-memory">Upload resume</Link>
              ) : (
                <Link className="button button-secondary" href="/pricing">Upgrade to Pro</Link>
              )}
            </div>
          </section>

          <section className="dashboard-module dashboard-upgrade">
            <Sparkles size={22} aria-hidden="true" />
            <div>
              <span className="dashboard-kicker">Build with Zesume</span>
              <h2>Turn one resume into a long-term career workspace.</h2>
            </div>
            <Link className="button button-primary" href="/pricing">
              Compare plans <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
