import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Alert } from '@mui/material';

import supabase from '../../lib/supabase';

export default function Auth({ redirectTo, updatePassword }) {
  const [ loading, setLoading ] = useState(false);
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ confirmedPassword, setConfirmedPassword ] = useState('');
  const [ confirmedPasswordError, setConfirmedPasswordError ] = useState(null);
  const [ error, setError ] = useState(null);

  const [ isMounted, setIsMounted ] = useState(false);
  const redirectTimeoutRef = useRef(null);

  const router = useRouter();
  
  const user = supabase.auth.user();

  const redirect = () => {
    redirectTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        router.push(redirectTo);
      }
    }, 3000);
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, [])

  useEffect(() => {
    clearTimeout(redirectTimeoutRef.current);

    const session = supabase.auth.session();

    if (session && !updatePassword) {
      // For some reason the server isn't seeing
      // the session, so let's clear it and sign
      // back in
      supabase.auth.signOut();
    } else if (updatePassword) {
      setPassword('');
      setConfirmedPassword('');
    }

    setLoading(false);
  }, [ updatePassword ]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    
    if (updatePassword) {
      const { error } = await supabase.auth.update({
        password,
        data: {
          temp_password: false,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        redirect();
      }
    } else {
      const { error } = await supabase.auth.signIn({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        redirect();
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <Stack spacing={2} direction="column">
        { error ? (
            <Alert severity="error">{error}</Alert>
          ) : null
        }
        {
          !updatePassword && (
            <TextField
              id="outlined-email"
              label="Email"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )
        }
        <TextField
          id="outlined-password"
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {
          updatePassword && (
            <TextField
              id="outlined-password"
              label="Confirm Password"
              variant="outlined"
              type="password"
              error={confirmedPasswordError}
              helperText={confirmedPasswordError || ''}
              value={confirmedPassword}
              onChange={(e) => setConfirmedPassword(e.target.value)}
              onBlur={() => {
                if (confirmedPassword !== password) {
                  setConfirmedPasswordError('Password do not match')
                } else {
                  setConfirmedPasswordError(null)
                }
              }}
            />
          )
        }
        <Button
          type="submit"
          disabled={loading || (!!user && !updatePassword ) || !!confirmedPasswordError}
          variant="contained"
        >
          {loading ? 'Logging in' : user && !updatePassword ? 'Redirecting ': updatePassword ? 'Update Password' : 'Login' }
        </Button>
      </Stack>
    </form>
  );
}
