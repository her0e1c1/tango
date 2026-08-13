type RemoteReadStatus = "idle" | "loading" | "ready" | "error" | "blocked";

type RemoteReadState = {
  status: RemoteReadStatus;
  retry: () => void | Promise<void>;
};

const combineStatus = (states: readonly RemoteReadState[]): RemoteReadStatus => {
  if (states.some(({ status }) => status === "blocked")) return "blocked";
  if (states.some(({ status }) => status === "error")) return "error";
  if (states.every(({ status }) => status === "ready")) return "ready";
  if (states.every(({ status }) => status === "idle")) return "idle";
  return "loading";
};

export const combineRemoteReadStates = (...states: readonly RemoteReadState[]) => ({
  status: combineStatus(states),
  retry: async () => {
    await Promise.allSettled(
      states.filter(({ status }) => status === "error" || status === "blocked").map(({ retry }) => retry())
    );
  },
});
