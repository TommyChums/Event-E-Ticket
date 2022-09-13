import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Alert } from '@mui/material';

import supabase from '../../lib/supabase';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Auth({ redirectTo }) {
  const [ loading, setLoading ] = useState(true);
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ error, setError ] = useState(null);
  const router = useRouter();
  const session = supabase.auth.session();

  const handleLogin = async (email) => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signIn({ email, password }, { redirectTo: '/users' });
    if (error) {
      setError(error.message);
    } else {
      router.push(redirectTo);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      router.push(redirectTo);
    } else {
      setLoading(false);
    }
  }, [ session, router, redirectTo ]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin(email);
      }}
    >
      <Stack spacing={2} direction="column">
        { error ? (
            <Alert severity="error">{error}</Alert>
          ) : null
        }
        <TextField
          id="outlined-email"
          label="Email"
          variant="outlined"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="outlined-password"
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          disabled={loading}
          variant="contained"
        >
          {loading ? 'Logging in' : 'Login'}
        </Button>
      </Stack>
    </form>
  );
}
