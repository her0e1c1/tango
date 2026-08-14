import type { RemoteSubscriptionProps, RemoteSyncStatus } from "@/shared/api";
import { createRemoteReadStore } from "@/shared/lib/remote-read";

type CardReadLifecycle = { id: string };

let retryCurrentRead: () => void = () => undefined;
const retry = (): void => retryCurrentRead();
let lifecycleSubscription: RemoteSubscriptionProps<CardReadLifecycle> | undefined;

export const cardRemoteReadStore = createRemoteReadStore<CardReadLifecycle>({
  subscribe: (subscription) => {
    lifecycleSubscription = subscription;
    return () => {
      if (lifecycleSubscription === subscription) lifecycleSubscription = undefined;
    };
  },
});
cardRemoteReadStore.setState({ retry });

export const setCardReadLoading = (uid: string, retryRead: () => void): void => {
  retryCurrentRead = retryRead;
  cardRemoteReadStore.getState().start(uid);
};

export const setCardReadReady = (uid: string, syncStatus: RemoteSyncStatus): void => {
  if (cardRemoteReadStore.getState().uid !== uid) return;
  lifecycleSubscription?.onSnapshot({ itemsById: {}, syncStatus });
};

export const setCardReadError = (uid: string, error: Error): void => {
  if (cardRemoteReadStore.getState().uid !== uid) return;
  lifecycleSubscription?.onError(error);
};

export const resetCardRead = (uid?: string): void => {
  if (uid != null && cardRemoteReadStore.getState().uid !== uid) return;
  cardRemoteReadStore.getState().stop(uid);
  retryCurrentRead = () => undefined;
};
