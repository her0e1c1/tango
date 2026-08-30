import { createStore } from "zustand/vanilla";

export type ToastId = number;

export type ToastTone = "neutral" | "success" | "warning" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ShowToastInput {
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
  durationMs?: number | null;
  dismissible?: boolean;
}

export interface ToastState {
  id: ToastId;
  message: string;
  tone: ToastTone;
  action: ToastAction | undefined;
  durationMs: number | null;
  dismissible: boolean;
}

interface ToastStoreState {
  current: ToastState | undefined;
  modalTargets: readonly ToastModalTarget[];
}

interface ToastModalTarget {
  id: number;
  element: HTMLElement;
  restoreFocus: () => void;
}

const DEFAULT_DURATION_MS: Record<ToastTone, number | null> = {
  neutral: 4000,
  success: 4000,
  warning: null,
  error: null,
};

let nextToastId = 0;
let nextModalTargetId = 0;

export const toastStore = createStore<ToastStoreState>()(() => ({ current: undefined, modalTargets: [] }));

export const registerToastModalTarget = (element: HTMLElement, restoreFocus: () => void): (() => void) => {
  nextModalTargetId += 1;
  const id = nextModalTargetId;
  toastStore.setState((state) => ({ modalTargets: [...state.modalTargets, { id, element, restoreFocus }] }));

  // A stale cleanup must not unregister a newer or nested modal outlet.
  return () => {
    toastStore.setState((state) => ({ modalTargets: state.modalTargets.filter((target) => target.id !== id) }));
  };
};

const restoreModalFocus = (): void => {
  const modalTarget = toastStore.getState().modalTargets.at(-1);
  if (modalTarget === undefined || typeof document === "undefined") return;
  const { activeElement } = document;
  if (activeElement instanceof HTMLElement && modalTarget.element.contains(activeElement)) {
    modalTarget.restoreFocus();
  }
};

export const showToast = (input: ShowToastInput): ToastId => {
  if (toastStore.getState().current !== undefined) restoreModalFocus();
  const tone = input.tone ?? "neutral";
  nextToastId += 1;
  const id = nextToastId;

  toastStore.setState({
    current: {
      id,
      message: input.message,
      tone,
      action: input.action,
      durationMs: input.durationMs === undefined ? DEFAULT_DURATION_MS[tone] : input.durationMs,
      dismissible: input.dismissible ?? true,
    },
  });

  return id;
};

export const dismissToast = (id?: ToastId): void => {
  const { current } = toastStore.getState();
  if (current === undefined || (id !== undefined && current.id !== id)) return;
  restoreModalFocus();
  toastStore.setState({ current: undefined });
};
