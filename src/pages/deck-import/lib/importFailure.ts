export class ImportFailure extends Error {
  constructor(readonly code: "authentication" | "account-changed" | "encoding") {
    super(code);
    this.name = "ImportFailure";
  }
}

export function importFailureKey(error: unknown): string | undefined {
  const code = error != null && typeof error === "object" && "code" in error ? error.code : undefined;
  if (error instanceof ImportFailure) {
    if (error.code === "encoding") return "deckImport.errors.encoding";
    return error.code === "authentication" ? "deckImport.errors.authentication" : "deckImport.errors.accountChanged";
  }
  if (code === "permission-denied") return "deckImport.errors.permission";
  if (code === "unauthenticated") return "deckImport.errors.authentication";
  if (code === "unavailable" || code === "auth/network-request-failed") return "deckImport.errors.network";
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "deckImport.errors.storage";
  return undefined;
}
