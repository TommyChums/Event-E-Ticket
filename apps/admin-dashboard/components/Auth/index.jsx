import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Alert } from '@mui/material';

export default function Auth({ redirectTo, updatePassword }) {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [ loading, setLoading ] = useState(false);
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ confirmedPassword, setConfirmedPassword ] = useState('');
  const [ confirmedPasswordError, setConfirmedPasswordError ] = useState(null);
  const [ error, setError ] = useState(null);

  const [ isMounted, setIsMounted ] = useState(false);
  const redirectTimeoutRef = useRef(null);

  const router = useRouter();

  const buttonText = useMemo(() => {
    let returnText = 'Login';

    if (loading) {
      returnText = 'Logging in';
    } else if (user && !updatePassword) {
      returnText = 'Redirecting';
    } else if (updatePassword) {
      returnText = 'Update Password';
    }

    return returnText;
  }, [ loading, user, updatePassword ]);

  const redirect = () => {
    redirectTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        if (redirectTo === router.pathname) {
          router.reload();
        } else {
          router.push(redirectTo);
        }
      }
    }, 3000);
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    clearTimeout(redirectTimeoutRef.current);

    if (updatePassword) {
      setPassword('');
      setConfirmedPassword('');
    }

    setLoading(false);
  }, [ updatePassword ]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    if (updatePassword) {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          temp_password: false
        }
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        redirect();
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
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
      <Stack direction="column" spacing={2}>
        { error ?
          <Alert severity="error">{error}</Alert>
          : null
        }
        {
          !updatePassword &&
            <TextField
              id="outlined-email"
              label="Email"
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              value={email}
              variant="outlined"
            />

        }
        <TextField
          id="outlined-password"
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          value={password}
          variant="outlined"
        />
        {
          updatePassword &&
            <TextField
              error={confirmedPasswordError}
              helperText={confirmedPasswordError || ''}
              id="outlined-password"
              label="Confirm Password"
              onBlur={() => {
                if (confirmedPassword !== password) {
                  setConfirmedPasswordError('Password do not match');
                } else {
                  setConfirmedPasswordError(null);
                }
              }}
              onChange={(e) => setConfirmedPassword(e.target.value)}
              type="password"
              value={confirmedPassword}
              variant="outlined"
            />

        }
        <Button
          disabled={loading || !!user && !updatePassword || !!confirmedPasswordError}
          type="submit"
          variant="contained"
        >
          { buttonText }
        </Button>
      </Stack>
    </form>
  );
};

Auth.propTypes = {
  redirectTo: PropTypes.string.isRequired,
  updatePassword: PropTypes.bool
};

Auth.defaultProps = {
  updatePassword: false
};
