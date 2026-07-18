import * as React from "react";

interface AccountOperationDependencies {
  login: () => Promise<void>;
  logout?: () => Promise<void>;
}

type AccountOperationKind = "login" | "logout";

interface AccountOperationState {
  kind: AccountOperationKind | null;
  pending: boolean;
  error: unknown;
}

export const useAccountOperations = ({ login, logout }: AccountOperationDependencies) => {
  const dependenciesRef = React.useRef({ login, logout });
  const inFlightRef = React.useRef<Promise<void> | null>(null);
  const lastFailedKindRef = React.useRef<AccountOperationKind | null>(null);
  const [state, setState] = React.useState<AccountOperationState>({ kind: null, pending: false, error: null });

  dependenciesRef.current = { login, logout };

  const run = React.useCallback((kind: AccountOperationKind): Promise<void> => {
    if (inFlightRef.current != null) return inFlightRef.current;

    const operation = kind === "login" ? dependenciesRef.current.login : dependenciesRef.current.logout;
    if (operation == null) return Promise.resolve();

    lastFailedKindRef.current = null;
    setState({ kind, pending: true, error: null });
    const promise = operation().then(
      () => setState({ kind, pending: false, error: null }),
      (error: unknown) => {
        lastFailedKindRef.current = kind;
        setState({ kind, pending: false, error });
        throw error;
      }
    );
    inFlightRef.current = promise;
    void promise.then(
      () => {
        if (inFlightRef.current === promise) inFlightRef.current = null;
      },
      () => {
        if (inFlightRef.current === promise) inFlightRef.current = null;
      }
    );

    return promise;
  }, []);

  const retry = React.useCallback(() => {
    return lastFailedKindRef.current == null ? Promise.resolve() : run(lastFailedKindRef.current);
  }, [run]);

  return {
    ...state,
    login: () => run("login"),
    logout: () => run("logout"),
    retry,
  };
};
