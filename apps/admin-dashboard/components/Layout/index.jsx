import { useRouter } from 'next/router';
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

import supabase from '../../lib/supabase';

export default function Layout({ children }) {
  const router = useRouter();

  // Login page
  if (router.pathname === '/') {
    return children;
  }

  return (
    <Stack direction="column" spacing={3}>
      <Stack direction="row" justifyContent="end">
        <Button
          variant='contained'
          size="small"
          onClick={() => {
            supabase.auth.signOut();
            router.push('/');
          }}
        >
          Logout
        </Button>
      </Stack>
      <main>
        {children}
      </main>
    </Stack>
  );
};
