import { useRouter } from 'next/router';
import { createContext, useContext, useEffect } from 'react';
import useEvent from '../lib/hooks/useEvent';
import useUsers from '../lib/hooks/useUsers';
import supabase from '../lib/supabase';

const AppContext = createContext();

export function AppWrapper({ children }) {
  const router = useRouter();

  const { error, isLoading, users } = useUsers();
  const { event: usersEvent, isLoading: eventLoading } = useEvent('16e9856f-4caf-478d-a553-b7e3ae9c86a0');

  useEffect(() => {
    let subscription = null;
    const currentSession = supabase.auth.session();

    if (!currentSession && router.pathname !== '/') router.push('/');
    else {
      subscription = supabase.auth.onAuthStateChange((event, session) => {
        if (!session && router.pathname !== '/') {
          router.push('/');
        }
      });
    }

    return () => subscription && subscription.data.unsubscribe();
  }, [ router ]);

  return (
    <AppContext.Provider value={{ users, event: usersEvent, loading: isLoading || eventLoading }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext);
};
