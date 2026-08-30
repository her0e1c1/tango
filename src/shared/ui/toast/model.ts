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
}

const DEFAULT_DURATION_MS: Record<ToastTone, number | null> = {
  neutral: 4000,
  success: 4000,
  warning: null,
  error: null,
};

let nextToastId = 0;

export const toastStore = createStore<ToastStoreState>()(() => ({ current: undefined }));

export const showToast = (input: ShowToastInput): ToastId => {
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
  toastStore.setState({ current: undefined });
};
