import { auth } from "@/auth";

export type CurrentUser = {
  id?: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export async function getCurrentUser(_request?: Request): Promise<CurrentUser | null> {
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
