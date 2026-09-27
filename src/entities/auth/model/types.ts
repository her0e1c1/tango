/** Authenticated Firebase session details shared by anonymous and linked users. */
interface AuthenticatedSession {
  /** Firebase UID of the active user. */
  uid: string;
  /** User display name; null when no name is available. */
  displayName: string | null;
  /** Whether the active user has an anonymous Firebase account. */
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
  | {
      /** Authentication lifecycle discriminant. */
      status: "initializing";
    }
  /**
   * Firebase currently has no user.
   *
   * This is a transient state in Tango. Study state is cleared before anonymous
   * authentication starts, after which the session moves to `authenticating`.
   */
  | {
      /** Authentication lifecycle discriminant. */
      status: "unauthenticated";
    }
  /**
   * Anonymous authentication has started and Tango is waiting for Firebase to
   * publish the resulting user.
   *
   * `attemptId` identifies the in-flight attempt so that a late failure from an
   * older attempt cannot overwrite a newer authentication attempt.
   */
  | {
      /** Authentication lifecycle discriminant. */
      status: "authenticating";
      /** Identity that prevents stale failures from replacing a newer attempt. */
      attemptId: symbol;
    }
  /**
   * Firebase has an active user.
   *
   * Both anonymous and linked users use this state. `isAnonymous` indicates
   * which kind of authenticated user is active.
   */
  | ({
      /** Authentication lifecycle discriminant. */
      status: "authenticated";
    } & AuthenticatedSession)
  /**
   * Authentication startup failed.
   *
   * This currently covers failures while clearing Study state before anonymous
   * bootstrap or while starting anonymous authentication.
   */
  | {
      /** Authentication lifecycle discriminant. */
      status: "error";
      /** Original startup failure retained for error handling. */
      error: unknown;
    };
