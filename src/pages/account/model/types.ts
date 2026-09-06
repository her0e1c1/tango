interface AccountPageState {
  signIn: { pending: boolean };
  signOut: { pending: boolean };
}

export type AccountOperation = keyof AccountPageState;

export interface AccountStoreState {
  pageState: AccountPageState;
  ownerId: symbol | null;
}
