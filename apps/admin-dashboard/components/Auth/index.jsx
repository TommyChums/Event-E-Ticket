import { useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Alert } from '@mui/material';

import supabase from '../../lib/supabase';

export default function Auth({ redirectTo }) {
  const [ loading, setLoading ] = useState(false);
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ error, setError ] = useState(null);
  const router = useRouter();
  
  const user = supabase.auth.user();

  const handleLogin = async (email) => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signIn({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push(redirectTo);
    }
    setLoading(false);
  };

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
          disabled={loading || !!user}
          variant="contained"
        >
          {loading ? 'Logging in' : user ? 'Redirecting ': 'Login'}
        </Button>
      </Stack>
    </form>
  );
}
