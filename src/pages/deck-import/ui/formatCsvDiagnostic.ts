import type { TFunction } from "i18next";
import type { CsvDiagnostic } from "../lib/cardCsv";

export function formatCsvDiagnostic(diagnostic: CsvDiagnostic, t: TFunction): string {
  switch (diagnostic.kind) {
    case "card":
      return t(diagnostic.reason === "required" ? `validation.required.${diagnostic.field}` : "validation.invalid");
    case "duplicate":
      return t("deckImport.diagnostics.duplicate", { uniqueKey: diagnostic.uniqueKey });
    case "columns":
      return t("deckImport.diagnostics.columns", { count: diagnostic.count });
    case "empty":
      return t("deckImport.diagnostics.empty");
    case "parser":
      if (diagnostic.type === "Quotes" && diagnostic.code === "MissingQuotes")
        return t("deckImport.diagnostics.missingQuotes");
      if (diagnostic.type === "Quotes" && diagnostic.code === "InvalidQuotes")
        return t("deckImport.diagnostics.invalidQuotes");
      return t("deckImport.diagnostics.parser");
  }
}
