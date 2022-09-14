import { createContext, useContext } from 'react';
import useEvent from '../lib/hooks/useEvent';
import useUsers from '../lib/hooks/useUsers';

const AppContext = createContext();

export function AppWrapper({ children }) {
  const { isLoading, users } = useUsers();
  const { event: usersEvent, isLoading: eventLoading } = useEvent('16e9856f-4caf-478d-a553-b7e3ae9c86a0');

  return (
    <AppContext.Provider value={{ users, event: usersEvent, loading: isLoading || eventLoading }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext);
};
