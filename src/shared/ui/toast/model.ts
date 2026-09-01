import { createStore } from "zustand/vanilla";

export type ToastId = number;

export type ToastTone = "neutral" | "success" | "warning" | "error";

export interface ShowToastInput {
  message: string;
  tone?: ToastTone;
  durationMs?: number | null;
  dismissible?: boolean;
}

export interface ToastState {
  id: ToastId;
  message: string;
  tone: ToastTone;
  durationMs: number | null;
  dismissible: boolean;
  returnFocusTarget: HTMLElement | undefined;
}

interface ToastStoreState {
  current: ToastState | undefined;
  focusFallbackTargets: readonly ToastFocusFallbackTarget[];
  visualTarget: ToastVisualTarget | undefined;
}

interface ToastFocusFallbackTarget {
  id: number;
  element: HTMLElement;
}

interface ToastVisualTarget {
  toastId: ToastId;
  element: HTMLElement;
}

const DEFAULT_DURATION_MS: Record<ToastTone, number | null> = {
  neutral: 4000,
  success: 4000,
  warning: null,
  error: null,
};

let nextToastId = 0;
let nextFocusFallbackTargetId = 0;

export const toastStore = createStore<ToastStoreState>()(() => ({
  current: undefined,
  focusFallbackTargets: [],
  visualTarget: undefined,
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

export const registerToastVisualTarget = (toastId: ToastId, element: HTMLElement): (() => void) => {
  if (toastStore.getState().current?.id !== toastId) return () => undefined;
  toastStore.setState({ visualTarget: { toastId, element } });

  // Portal moves and replacements can clean up after a newer visual target has registered.
  return () => {
    toastStore.setState((state) =>
      state.visualTarget?.toastId === toastId && state.visualTarget.element === element
        ? { visualTarget: undefined }
        : state
    );
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
  if (focusedElement === undefined) return;
  const { focusFallbackTargets, visualTarget } = toastStore.getState();
  if (visualTarget?.toastId !== toast.id || !visualTarget.element.contains(focusedElement)) return;
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
  const { current } = toastStore.getState();
  if (current !== undefined) restoreToastFocus(current);
  const tone = input.tone ?? "neutral";
  nextToastId += 1;
  const id = nextToastId;

  toastStore.setState({
    current: {
      id,
      message: input.message,
      tone,
      durationMs: input.durationMs === undefined ? DEFAULT_DURATION_MS[tone] : input.durationMs,
      dismissible: input.dismissible ?? true,
      returnFocusTarget: getFocusedElement(),
    },
    visualTarget: undefined,
  });

  return id;
};

export const dismissToast = (id?: ToastId): void => {
  const { current } = toastStore.getState();
  if (current === undefined || (id !== undefined && current.id !== id)) return;
  restoreToastFocus(current);
  // Focus restoration may synchronously publish another Toast; never clear that newer notification.
  toastStore.setState((state) =>
    state.current?.id === current.id ? { current: undefined, visualTarget: undefined } : state
  );
};
