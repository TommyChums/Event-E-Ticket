import { useContext } from 'react';

import { AppContext } from '../state/context/AppContext';

export default function useDispatch() {
  const { dispatch } = useContext(AppContext);
  return dispatch;
};
