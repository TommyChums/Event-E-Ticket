import React, { useState } from 'react'
import { useRouter } from 'next/router';
import Backdrop from '@mui/material/Backdrop';
import Container from '@mui/material/Container'
import CircularProgress from '@mui/material/CircularProgress';

import EventForm from '../../components/EventForm'
import useEvent from '../../lib/hooks/useEvent';

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
  )
}
