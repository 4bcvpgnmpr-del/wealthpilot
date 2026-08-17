import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Devuelve el userId de la sesión activa, o null si no hay sesión. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id as string;
}
