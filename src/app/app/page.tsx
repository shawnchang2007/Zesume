import { UserMenu } from "@/components/auth/UserMenu";
import { ResumeWorkspace } from "@/components/resume/ResumeWorkspace";

export default function AppPage() {
  return (
    <ResumeWorkspace
      authSlot={<UserMenu redirectToAfterSignOut="/app" />}
    />
  );
}
