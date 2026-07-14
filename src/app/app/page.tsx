import type { Metadata } from "next";
import { UserMenu } from "@/components/auth/UserMenu";
import { ResumeWorkspace } from "@/components/resume/ResumeWorkspace";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Free AI Resume & CV Builder",
  description:
    "Start free: import a resume or CV, choose a career target and structure, then generate and export a fact-safe tailored version.",
  alternates: { canonical: "/app" },
  openGraph: { title: "Free AI Resume & CV Builder | Zesume", url: "/app" },
};

export default async function AppPage() {
  const currentUser = await getCurrentUser();
  const access = await getCurrentAccess(currentUser, { includeUsage: false });

  return (
    <ResumeWorkspace
      authSlot={<UserMenu redirectToAfterSignOut="/app" user={currentUser} />}
      canImportFromProfile={canUseFeature(access, "PROFILE_GENERATION")}
      canUploadTemplate={canUseFeature(access, "CUSTOM_TEMPLATE")}
      plan={access.plan}
    />
  );
}
