import { useContext } from 'react';

import { AppContext } from '../state/context/AppContext';

export default function useEventsContext() {
  const context = useContext(AppContext);
  return context;
};
