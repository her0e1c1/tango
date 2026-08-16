/** Linked Firebase account details exposed to authenticated consumers. */
export interface AuthAccount {
  uid: string;
  displayName: string | null;
}

/** Authenticated Firebase session details shared by anonymous and linked users. */
interface AuthenticatedSession extends AuthAccount {
  isAnonymous: boolean;
}

/**
 * Authentication lifecycle exposed to the rest of the application.
 *
 * A typical anonymous startup follows:
 * `initializing` -> `unauthenticated` -> `authenticating` -> `authenticated`.
 *
 * `authenticated` represents any Firebase user. Use `isAnonymous` to distinguish
 * an anonymous user from a linked account.
 */
export type AuthSessionState =
  /** Waiting for Firebase to publish the initial authentication snapshot. */
  | { status: "initializing" }
  /**
   * Firebase currently has no user.
   *
   * This is a transient state in Tango. Study state is cleared before anonymous
   * authentication starts, after which the session moves to `authenticating`.
   */
  | { status: "unauthenticated" }
  /**
   * Anonymous authentication has started and Tango is waiting for Firebase to
   * publish the resulting user.
   *
   * `attemptId` identifies the in-flight attempt so that a late failure from an
   * older attempt cannot overwrite a newer authentication attempt.
   */
  | { status: "authenticating"; attemptId: symbol }
  /**
   * Firebase has an active user.
   *
   * Both anonymous and linked users use this state. `isAnonymous` indicates
   * which kind of authenticated user is active.
   */
  | ({ status: "authenticated" } & AuthenticatedSession)
  /**
   * Authentication startup failed.
   *
   * This currently covers failures while clearing Study state before anonymous
   * bootstrap or while starting anonymous authentication.
   */
  | { status: "error"; error: unknown };
