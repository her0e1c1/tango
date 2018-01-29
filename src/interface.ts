import { ThunkAction as _ThunkAction } from 'redux-thunk';

export type ThunkAction = _ThunkAction<Promise<void>, RootState, undefined>;
