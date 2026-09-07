import { getAuthSession } from "@/entities/auth";

export function getDeckImportUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
}
