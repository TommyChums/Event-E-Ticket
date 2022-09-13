import { useEffect, useState } from 'react';
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useRouter } from 'next/router';

import supabase from '../../lib/supabase';

export default function Layout({ children }) {
  const [ session, setSession ] = useState();
  const user = supabase.auth.user();
  const router = useRouter();

  useEffect(() => {
    const session = supabase.auth.session();

    if (session) {
      setSession(session);
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (router.pathname === '/') return;

    if (!session) router.push('/');
  }, [ router, session ])

  // Login page
  if (router.pathname === '/') {

    return children;
  }

  if (!session || !user) {
    return <div>Loading...</div>
  }

  return (
    <Stack direction="column" spacing={3}>
      <Stack direction="row" justifyContent="end">
        <Button
          variant='contained'
          size="small"
          onClick={() => {
            supabase.auth.signOut();
          }}
        >
          Logout
        </Button>
      </Stack>
      {children}
    </Stack>
  );
};
