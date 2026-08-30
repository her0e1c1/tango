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
  returnFocusTarget: HTMLElement | undefined;
}

interface ToastStoreState {
  current: ToastState | undefined;
  modalTargets: readonly ToastModalTarget[];
  visualTarget: ToastVisualTarget | undefined;
}

interface ToastModalTarget {
  id: number;
  element: HTMLElement;
  restoreFocus: () => void;
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
let nextModalTargetId = 0;

export const toastStore = createStore<ToastStoreState>()(() => ({
  current: undefined,
  modalTargets: [],
  visualTarget: undefined,
}));

export const registerToastModalTarget = (element: HTMLElement, restoreFocus: () => void): (() => void) => {
  nextModalTargetId += 1;
  const id = nextModalTargetId;
  toastStore.setState((state) => ({ modalTargets: [...state.modalTargets, { id, element, restoreFocus }] }));

  // A stale cleanup must not unregister a newer or nested modal outlet.
  return () => {
    toastStore.setState((state) => ({ modalTargets: state.modalTargets.filter((target) => target.id !== id) }));
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
  const { modalTargets, visualTarget } = toastStore.getState();
  const modalTarget = modalTargets.at(-1);
  if (modalTarget?.element.contains(focusedElement)) {
    modalTarget.restoreFocus();
    return;
  }
  if (
    visualTarget?.toastId === toast.id &&
    visualTarget.element.contains(focusedElement) &&
    toast.returnFocusTarget?.isConnected
  ) {
    toast.returnFocusTarget.focus();
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
      action: input.action,
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
