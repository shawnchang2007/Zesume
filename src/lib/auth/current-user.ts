export type CurrentUser = {
  id: string;
  email?: string;
};

export async function getCurrentUser(_request: Request): Promise<CurrentUser | null> {
  // Phase 1 has no auth provider yet. Replace this with Clerk/Auth.js/Supabase
  // session lookup when login is added.
  return null;
}
