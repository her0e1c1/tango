import { getAuthSession } from "@/entities/auth";

export function isStudyActorCurrent(uid: string, localOnly: boolean): boolean {
  const session = getAuthSession();
  return session.status === "authenticated" && session.uid === uid && (localOnly || !session.isAnonymous);
}
