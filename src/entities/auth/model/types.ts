/** Firebase-independent identity for the currently authenticated user. */
export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
}

/** Linked account details exposed to account-aware consumers. */
export type AuthAccount = Pick<AuthUser, "uid" | "displayName">;
