export class FirestoreInitializationError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = "FirestoreInitializationError";
  }
}
