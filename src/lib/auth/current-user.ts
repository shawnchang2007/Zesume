import { auth } from "@/auth";
import { cache } from "react";

export type CurrentUser = {
  id?: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

async function resolveCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const currentUser: CurrentUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };

  return currentUser;
}

const getCachedCurrentUser = cache(resolveCurrentUser);

export function getCurrentUser(_request?: Request) {
  return getCachedCurrentUser();
}
