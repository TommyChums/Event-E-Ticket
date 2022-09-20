import '../assets/css/global.css';
import 'react-resizable/css/styles.css';
import "react-color-palette/lib/css/styles.css";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SnackbarProvider } from 'notistack';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Layout from '../components/Layout';
import supabase from '../lib/supabase';
import updateSupabaseCookie from '../lib/helpers/updateSupabaseCookie';

const theme = createTheme({
  palette: {
    primary: {
      // Purple and green play nicely together.
      main: '#673ab7',
    },
    secondary: {
      // This is green.A700 as hex.
      main: '#651fff',
    },
  },
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      await updateSupabaseCookie(event, session);
      if (session && router.pathname === '/login') {
        router.push('/events');
      } else if (!session && router.pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  });

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SnackbarProvider>
    </ThemeProvider>
  );
};
