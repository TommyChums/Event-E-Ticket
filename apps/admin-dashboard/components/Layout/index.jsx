import { useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

import supabase from '../../lib/supabase';

export default function Layout({ children }) {
  const router = useRouter();

  const [ signingOut, setSigningOut ] = useState(false);

  // Login page
  if (router.pathname === '/') {
    return children;
  }

  return (
    <Stack direction="column" spacing={3}>
      <Stack direction="row" justifyContent="end">
        <Button
          disabled={signingOut}
          variant='contained'
          size="small"
          onClick={() => {
            setSigningOut(true);
            supabase.auth.signOut();
            router.push('/');
          }}
        >
          { signingOut ? 'Logging out' : 'Logout' }
        </Button>
      </Stack>
      <main>
        {children}
      </main>
    </Stack>
  );
};
