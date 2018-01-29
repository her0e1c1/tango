import { ThunkAction as _ThunkAction } from 'redux-thunk';

export type ThunkAction = _ThunkAction<Promise<void>, RootState, undefined>;

export function returntypeof<RT>(expression: (...params: any[]) => RT): RT {
  return undefined as any;
}
