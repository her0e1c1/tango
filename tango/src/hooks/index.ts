import * as React from 'react';
import { useDispatch } from 'react-redux';

export { useDispatch };

export const useThunkAction = action => {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    return dispatch(action);
  }, [dispatch]);
};
