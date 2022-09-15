import '../assets/css/global.css';
import { useEffect } from 'react';
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
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      updateSupabaseCookie(event, session);
    });

    return () => {
      authListener?.unsubscribe();
    };
  });

  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
};
