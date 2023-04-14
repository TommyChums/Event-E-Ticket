import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Backdrop from '@mui/material/Backdrop';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import EventForm from '../../components/EventForm';
import protectedRoute from '../../lib/helpers/protectedRoute';
import isAdminUser from '../../lib/helpers/isAdminUser';
import useDispatch from '../../lib/hooks/useDispatch';
import { updateEvent } from '../../lib/state/actions/events';

export default function NewEvent() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [ creating, setCreating ] = useState(false);

  const handleOnSave = (newEvent) => {
    dispatch(updateEvent(newEvent));

    setCreating(true);

    console.log('Event Created:', newEvent);

    router.push(`events/${newEvent.uuid}`).then(() => {
      setCreating(false);
    });
  };

  return (
    <>
      <Head>
        <title>New Event</title>
        <meta content="New Event" key="title" property="og:title" />
        <link href="/images/rlc-logo.ico" rel="icon" type="image/x-icon" />
      </Head>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginTop: '16px'
        }}
      >
        <Backdrop open={creating} sx={{ color: '#fff' }}>
          <CircularProgress />
        </Backdrop>
        <EventForm isNew onSave={handleOnSave}/>
      </Container>
    </>
  );
};

export const getServerSideProps = protectedRoute((_, { user }) => {
  const isAdmin = isAdminUser(user);

  if (isAdmin) {
    return { props: {} };
  }

  return {
    notFound: true
  };
});
