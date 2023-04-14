import '../assets/css/global.css';
import 'react-resizable/css/styles.css';
import 'react-color-palette/lib/css/styles.css';
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { SnackbarProvider } from 'notistack';
import { ConfirmProvider } from 'material-ui-confirm';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

import Layout from '../components/Layout';
import EventsProvider from '../lib/state/context/AppContext';
import useEventsContext from '../lib/hooks/useEventsContext';
import { eventsErrorAction, eventsLoadingAction, receivedEventsAction } from '../lib/state/actions/events';

const theme = createTheme({
  palette: {
    primary: {
      // Purple and green play nicely together.
      main: '#673ab7'
    },
    secondary: {
      // This is green.A700 as hex.
      main: '#651fff'
    }
  }
});

function ContextualisedApp({ children, notFound }) {
  const supabase = useSupabaseClient();
  const authenticatedUser = useUser();
  const pollRef = useRef(null);
  const { dispatch } = useEventsContext();

  useEffect(() => {
    if (!authenticatedUser) {
      return;
    }

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
  }, [ authenticatedUser, dispatch, supabase ]);


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

ContextualisedApp.propTypes = {
  children: PropTypes.node.isRequired,
  notFound: PropTypes.bool
};

ContextualisedApp.defaultProps = {
  notFound: false
};

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const [ supabaseClient ] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    if (pageProps?.notFound) {
      router.push('/login');
    }
  }, [ pageProps, router ]);

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
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
    </SessionContextProvider>
  );
};

App.propTypes = {
  Component: PropTypes.any.isRequired,
  pageProps: PropTypes.object.isRequired
};
