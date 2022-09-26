import React, { useState } from 'react'
import Head from 'next/head';
import { useRouter } from 'next/router';
import Backdrop from '@mui/material/Backdrop';
import Container from '@mui/material/Container'
import CircularProgress from '@mui/material/CircularProgress';

import EventForm from '../../components/EventForm'
import useEvent from '../../lib/hooks/useEvent';
import protectedRoute from '../../lib/helpers/protectedRoute';
import isAdminUser from '../../lib/helpers/isAdminUser';

export default function NewEvent() {
  const router = useRouter();
  const { updateEvent } = useEvent();

  const [ creating, setCreating ] = useState(false);

  const handleOnSave = (newEvent) => {
    updateEvent(newEvent);
    setCreating(true);
    console.log('Event Created:', newEvent);

    router.push(`events/${newEvent.uuid}`).then(() => {
      setCreating(false);
    });
  }

  return (
    <>
      <Head>
        <title>New Event</title>
        <meta property="og:title" content="New Event" key="title" />
        <link rel="icon" type="image/x-icon" href="/images/rlc-logo.ico" />
      </Head>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginTop: '16px',
        }}
      >
        <Backdrop open={creating} sx={{ color: '#fff' }}>
          <CircularProgress />
        </Backdrop>
        <EventForm isNew onSave={handleOnSave}/>
      </Container>
    </>
  )
};

export const getServerSideProps = protectedRoute((_, authenticatedSupabase) => {
  const isAdmin = isAdminUser(authenticatedSupabase);

  if (isAdmin) {
    return { props: {} };
  }

  return {
    notFound: true,
  };
});
