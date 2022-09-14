import { Fragment } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import map from 'lodash/map';

import supabase from "../lib/supabase";

export async function getServerSideProps() {
  const { data: events, error } = await supabase.from('events').select('*');

  if (error) throw error;

  return {
    props: {
      events: events.map((event) => {
        const logoLocation = event.logo;

        if (logoLocation) {
          const { publicURL, error } = supabase.storage.from(logoLocation.bucket).getPublicUrl(logoLocation.key);

          if (error) throw error;

          event.logo = publicURL;
        }

        return event;
      }),
    },
  };
};

export default function EventsHome({ events }) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Reformation Life Centre - Events</title>
        <meta property="og:title" content="Reformation Life Centre - Events" key="title" />
        <link rel="icon" type="image/x-icon" href="/images/rlc-logo.ico" />
      </Head>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem 0'
        }}
      >
        <Stack direction="column" spacing={3}>
          <Typography
            sx={{ display: 'inline' }}
            component="span"
            variant="h4"
            color="text.primary"
          >
            Welcome to Reformation Life Centre&apos;s events page.
          </Typography>
          <Typography
            sx={{ display: 'inline' }}
            component="span"
            variant="h5"
            color="text.primary"
          >
            { 
              events.length
                ? 'These are all our current events. Click one to register.'
                : 'We currently have no events schedules. Check us back at a later date.'
            }
          </Typography>
        </Stack>
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', margin: '1rem 0 0' }}>
          {
            map(events, (event, i) => {
              const isFirst = i === 0;
              return (
                <Fragment key={event.uuid}>
                  { !isFirst ? <Divider variant="inset" component="li" /> : null}
                  <ListItemButton alignItems="flex-start" onClick={() => router.push(`/${event.uuid}`)}>
                    <ListItemAvatar>
                      <Avatar alt={event.name} src={event.logo} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.name}
                      secondary={
                        <Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {event.host}
                          </Typography>
                          {` — ${event.description}` || ` — Presents ${event.name}`}
                        </Fragment>
                      }
                    />
                  </ListItemButton>
                </Fragment>
              );
            })
          }
        </List>
      </Container>
    </>
  );  
}
