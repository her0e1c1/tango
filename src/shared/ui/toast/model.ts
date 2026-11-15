import type { ReactNode } from "react";
import { createStore } from "zustand/vanilla";

type ToastId = number;

export type ToastTone = "neutral" | "success" | "warning" | "error";

interface ToastMessage {
  messageKey: string;
  messageParams?: Readonly<Record<string, string | number>> | undefined;
}

export interface ShowToastInput extends ToastMessage {
  /** Replaces the visible message while keeping the text available to the live-region announcement. */
  visualContent?: ReactNode;
  tone?: ToastTone;
  durationMs?: number | null;
  dismissible?: boolean;
  /** Keeps an independent result visible without replacing the primary notification. */
  supplementary?: boolean;
}

export interface ToastState {
  id: ToastId;
  messageKey: string;
  messageParams: ToastMessage["messageParams"];
  visualContent: ReactNode | undefined;
  tone: ToastTone;
  durationMs: number | null;
  dismissible: boolean;
  returnFocusTarget: HTMLElement | undefined;
}

interface ToastStoreState {
  current: ToastState | undefined;
  supplementary: ToastState | undefined;
  focusFallbackTargets: readonly ToastFocusFallbackTarget[];
  modalFocusTargets: readonly ToastModalFocusTarget[];
  visualTargets: readonly ToastVisualTarget[];
}

interface ToastFocusFallbackTarget {
  id: number;
  element: HTMLElement;
}

interface ToastModalFocusTarget extends ToastFocusFallbackTarget {
  fallbackElement: HTMLElement;
}

interface ToastVisualTarget {
  toastId: ToastId;
  element: HTMLElement;
}

const DEFAULT_DURATION_MS: Record<ToastTone, number | null> = {
  neutral: 4000,
  success: 4000,
  warning: null,
  error: 4000,
};

let nextToastId = 0;
let nextFocusFallbackTargetId = 0;
let nextModalFocusTargetId = 0;

export const toastStore = createStore<ToastStoreState>()(() => ({
  current: undefined,
  supplementary: undefined,
  focusFallbackTargets: [],
  modalFocusTargets: [],
  visualTargets: [],
}));

export const registerToastFocusFallbackTarget = (element: HTMLElement): (() => void) => {
  nextFocusFallbackTargetId += 1;
  const id = nextFocusFallbackTargetId;
  toastStore.setState((state) => ({
    focusFallbackTargets: [...state.focusFallbackTargets, { id, element }],
  }));

  // Strict Mode and remounts can run an older cleanup after a newer application fallback registered.
  return () => {
    toastStore.setState((state) => ({
      focusFallbackTargets: state.focusFallbackTargets.filter((target) => target.id !== id),
    }));
  };
};

export const registerToastModalFocusTarget = (element: HTMLElement, fallbackElement: HTMLElement): (() => void) => {
  nextModalFocusTargetId += 1;
  const id = nextModalFocusTargetId;
  toastStore.setState((state) => ({
    modalFocusTargets: [...state.modalFocusTargets, { id, element, fallbackElement }],
  }));

  return () => {
    toastStore.setState((state) => ({
      modalFocusTargets: state.modalFocusTargets.filter((target) => target.id !== id),
    }));
  };
};

export const registerToastVisualTarget = (toastId: ToastId, element: HTMLElement): (() => void) => {
  const { current, supplementary } = toastStore.getState();
  if (current?.id !== toastId && supplementary?.id !== toastId) return () => undefined;
  toastStore.setState((state) => ({
    visualTargets: [...state.visualTargets.filter((target) => target.toastId !== toastId), { toastId, element }],
  }));

  // Portal moves and replacements can clean up after a newer visual target has registered.
  return () => {
    toastStore.setState((state) => ({
      visualTargets: state.visualTargets.filter((target) => target.toastId !== toastId || target.element !== element),
    }));
  };
};

const getFocusedElement = (): HTMLElement | undefined => {
  if (typeof document === "undefined") return;
  const { activeElement } = document;
  return activeElement instanceof HTMLElement && activeElement !== document.body && activeElement.isConnected
    ? activeElement
    : undefined;
};

const restoreToastFocus = (toast: ToastState): void => {
  const focusedElement = getFocusedElement();
  const { focusFallbackTargets, modalFocusTargets, visualTargets } = toastStore.getState();
  const activeModal = modalFocusTargets.findLast(
    (target) => target.element.isConnected && target.fallbackElement.isConnected
  );
  if (activeModal !== undefined && (focusedElement === undefined || !activeModal.element.contains(focusedElement))) {
    activeModal.fallbackElement.focus();
    return;
  }
  if (focusedElement === undefined) return;
  const visualTarget = visualTargets.find((target) => target.toastId === toast.id);
  if (visualTarget === undefined || !visualTarget.element.contains(focusedElement)) return;
  if (toast.returnFocusTarget?.isConnected) {
    toast.returnFocusTarget.focus();
    return;
  }

  // CRUD success can replace the route immediately after publishing a Toast, disconnecting its original trigger.
  for (let index = focusFallbackTargets.length - 1; index >= 0; index -= 1) {
    const fallbackTarget = focusFallbackTargets[index];
    if (fallbackTarget?.element.isConnected) {
      fallbackTarget.element.focus();
      return;
    }
  }
};

export const showToast = (input: ShowToastInput): ToastId => {
  const slot = input.supplementary ? "supplementary" : "current";
  const previous = toastStore.getState()[slot];
  if (previous !== undefined) restoreToastFocus(previous);
  const tone = input.tone ?? "neutral";
  nextToastId += 1;
  const id = nextToastId;

  toastStore.setState((state) => ({
    [slot]: {
      id,
      // Resolve copy in the viewport so pending work and visible Toasts follow the active language.
      messageKey: input.messageKey,
      messageParams: input.messageParams,
      visualContent: input.visualContent,
      tone,
      durationMs: input.durationMs === undefined ? DEFAULT_DURATION_MS[tone] : input.durationMs,
      dismissible: input.dismissible ?? true,
      returnFocusTarget: getFocusedElement(),
    },
    visualTargets: state.visualTargets.filter((target) => target.toastId !== previous?.id),
  }));

  return id;
};

export const dismissToast = (id?: ToastId): void => {
  const { current, supplementary } = toastStore.getState();
  for (const toast of [current, supplementary]) {
    if (toast === undefined || (id !== undefined && toast.id !== id)) continue;
    restoreToastFocus(toast);
    // Focus restoration may synchronously publish another Toast; never clear that newer notification.
    toastStore.setState((state) => ({
      current: state.current?.id === toast.id ? undefined : state.current,
      supplementary: state.supplementary?.id === toast.id ? undefined : state.supplementary,
      visualTargets: state.visualTargets.filter((target) => target.toastId !== toast.id),
    }));
  }
};
