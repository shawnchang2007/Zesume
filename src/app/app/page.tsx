import { UserMenu } from "@/components/auth/UserMenu";
import { ResumeWorkspace } from "@/components/resume/ResumeWorkspace";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";

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
