import { getAuthSession } from "@/entities/auth";

export function getStudyUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
}
