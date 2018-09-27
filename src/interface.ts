import { ThunkAction as _ThunkAction } from 'redux-thunk';

export type ThunkAction<T = void> = _ThunkAction<Promise<T>, RootState, undefined>;

export function returntypeof<RT>(expression: (...params: any[]) => RT): RT {
  return undefined as any;
}
