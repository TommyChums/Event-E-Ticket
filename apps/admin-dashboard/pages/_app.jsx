import { useEffect } from 'react';
import Layout from '../components/Layout';
import { AppWrapper } from '../context/UsersAndEvents';
import supabase from '../lib/supabase';

async function updateSupabaseCookie(event, session) {
  await fetch('/api/auth', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify({ event, session }),
  });
};

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
    <AppWrapper>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppWrapper>
  );
};
