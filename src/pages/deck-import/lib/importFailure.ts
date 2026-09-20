export class ImportFailure extends Error {
  constructor(readonly code: "authentication" | "account-changed") {
    super(code);
    this.name = "ImportFailure";
  }
}

export function importFailureKey(error: unknown) {
  const code = error != null && typeof error === "object" && "code" in error ? error.code : undefined;
  if (error instanceof ImportFailure) {
    return error.code === "authentication" ? "deckImport.errors.authentication" : "deckImport.errors.accountChanged";
  }
  if (code === "permission-denied") return "deckImport.errors.permission";
  if (code === "unauthenticated") return "deckImport.errors.authentication";
  if (code === "unavailable" || code === "auth/network-request-failed") return "deckImport.errors.network";
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "deckImport.errors.storage";
  return undefined;
}
