import '../assets/css/global.css';
import 'react-resizable/css/styles.css';
import "react-color-palette/lib/css/styles.css";
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { SnackbarProvider } from 'notistack';
import { ConfirmProvider } from 'material-ui-confirm';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Layout from '../components/Layout';
import updateSupabaseCookie from '../lib/helpers/updateSupabaseCookie';
import EventsProvider from '../lib/state/context/AppContext';
import supabase from '../lib/supabase';
import useEventsContext from '../lib/hooks/useEventsContext';
import { eventsErrorAction, eventsLoadingAction, receivedEventsAction } from '../lib/state/actions/events';

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

function ContextualisedApp({ children, notFound }) {
  const pollRef = useRef(null);
  const { dispatch } = useEventsContext();

  const authenticatedUser = supabase.auth.user();

  useEffect(() => {
    if (!authenticatedUser) return;

    async function getEvents() {
      dispatch(eventsLoadingAction(true));
      const { data: events, error } = await supabase.from('events').select('*');
      
      if (error) {
        dispatch(eventsErrorAction(error));
      }
      
      dispatch(receivedEventsAction(events));
      dispatch(eventsLoadingAction(false));
    };

    getEvents();

    if (!pollRef.current) {
      pollRef.current = setInterval(() => {
        getEvents();
      }, 60 * 1000);
    }

    return () => {
      clearInterval(pollRef.current);
    };
  }, [ authenticatedUser, dispatch ]);


  if (notFound) {
    return (
      children
    );
  };

  return (
    <Layout>
      {children}
    </Layout>
  );
};

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      await updateSupabaseCookie(event, session);
      const needsPasswordUpdate = session && session.user?.user_metadata?.temp_password;

      if ((!session && router.pathname !== '/login') || needsPasswordUpdate) {
        router.push('/login');
      } else if (session && router.pathname === '/login') {
        router.push('/events');
      } 
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [ router ]);

  useEffect(() => {
    if (pageProps?.notFound) {
      router.push('/login');
    }
  }, [ pageProps, router ]);

  return (
    <EventsProvider>
      <ThemeProvider theme={theme}>
        <ConfirmProvider>
          <SnackbarProvider maxSnack={3}>
            <ContextualisedApp notFound={pageProps?.notFound}>
              <Component {...pageProps} />
            </ContextualisedApp>
          </SnackbarProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </EventsProvider>
  );
};
