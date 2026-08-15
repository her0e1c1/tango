import type { DeckImportAttempt, DeckImportRequest } from "./deckImportExecution";
import type { DeckImportPreview, DeckImportResult } from "./deckImportTypes";

export type DeckImportInput = DeckImportRequest | DeckImportAttempt;

export interface DeckImportState {
  uid: string;
  pending: boolean;
  validating: boolean;
  preview: DeckImportPreview | undefined;
  previewAttempt: DeckImportAttempt | undefined;
  previewError: unknown;
  error: unknown;
  data: DeckImportResult | undefined;
  retryInput: DeckImportInput | undefined;
}

type DeckImportEvent =
  | { type: "userChanged"; uid: string }
  | { type: "validationStarted"; uid: string }
  | { type: "validationSucceeded"; uid: string; preview: DeckImportPreview; attempt: DeckImportAttempt }
  | { type: "validationFailed"; uid: string; error: unknown }
  | { type: "importStarted"; uid: string; input: DeckImportInput }
  | { type: "importSucceeded"; uid: string; result: DeckImportResult; attempt: DeckImportAttempt }
  | { type: "importFailed"; uid: string; error: unknown; input: DeckImportInput };

export const initialDeckImportState = (uid: string): DeckImportState => ({
  uid,
  pending: false,
  validating: false,
  preview: undefined,
  previewAttempt: undefined,
  previewError: null,
  error: null,
  data: undefined,
  retryInput: undefined,
});

export const deckImportReducer = (state: DeckImportState, event: DeckImportEvent): DeckImportState => {
  // Async work from another authenticated scope must not change the current user's import state.
  if (event.type !== "userChanged" && event.uid !== state.uid) return state;

  switch (event.type) {
    case "userChanged":
      return initialDeckImportState(event.uid);
    case "validationStarted":
      return {
        ...state,
        validating: true,
        preview: undefined,
        previewAttempt: undefined,
        previewError: null,
        error: null,
        data: undefined,
        retryInput: undefined,
      };
    case "validationSucceeded":
      return { ...state, validating: false, preview: event.preview, previewAttempt: event.attempt };
    case "validationFailed":
      return { ...state, validating: false, previewError: event.error };
    case "importStarted":
      return { ...state, pending: true, error: null, retryInput: event.input };
    case "importSucceeded":
      return { ...state, pending: false, data: event.result, retryInput: event.attempt };
    case "importFailed":
      return { ...state, pending: false, data: undefined, error: event.error, retryInput: event.input };
  }
};
