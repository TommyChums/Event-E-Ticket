import { useEffect, useState } from 'react';
import Head from 'next/head';
import useMediaQuery from '@mui/material/useMediaQuery';

import supabase from '../lib/supabase';
import Auth from '../components/Auth';

export default function LoginPage() {
  const [ containerWidth, setContainerWidth ] = useState('100%');
  const isRegular = useMediaQuery('(max-width:1450px)');
  const isMedium = useMediaQuery('(max-width:1100px)');
  const isSmall = useMediaQuery('(max-width:820px)');

  useEffect(() => {
    if (isSmall) {
      setContainerWidth('100%');
    } else if (isMedium) {
      setContainerWidth('60%');
    } else if (isRegular) {
      setContainerWidth('40%');
    } else {
      setContainerWidth('30%');
    }
  }, [ isSmall, isMedium, isRegular ]);

  return (
    <>
      <Head>
        <title>Login | Admin Dashboard | Reformation Life Centre - Events</title>
        <meta property="og:title" content="Login | Admin Dashboard | Reformation Life Centre - Events" key="title" />
        <link rel="icon" type="image/x-icon" href="/images/rlc-logo.ico" />
      </Head>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '95vh'
        }}
      >
        <div
          style={{
            padding: '0 1rem',
            width: containerWidth
          }}
        >
          <Auth
            redirectTo="/events"
          />
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const { req } = context;

  const { user } = await supabase.auth.api.getUserByCookie(req);

  if (user) {
    return { props: {}, redirect: { destination: '/events', permanent: false } };
  }

  return { props: {} };
};
