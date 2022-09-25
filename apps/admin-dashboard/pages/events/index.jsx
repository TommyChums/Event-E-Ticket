import Head from 'next/head'
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { CardActionArea } from '@mui/material';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import map from 'lodash/map';

import protectedRoute from '../../lib/helpers/protectedRoute';
import getEventWithImgs from '../../lib/helpers/getEventWithImgs';

export const getServerSideProps = protectedRoute(async (_, authenticatedSupabase) => {
  const { data: events, error } = await authenticatedSupabase.from('events').select('*');

  if (error) throw error;

  return {
    props: {
      events: events.map((event) => {
        const { data } = getEventWithImgs(event, false, authenticatedSupabase);

        return data;
      }),
    },
  };
});

export default function EventsHome({ events }) {
  const isSmallScreen = useMediaQuery('(max-width:900px)');
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Events | Admin Dashboard | Reformation Life Centre - Events</title>
        <meta property="og:title" content="Reformation Life Centre - Events" key="title" />
        <link rel="icon" type="image/x-icon" href="/images/rlc-logo.ico" />
      </Head>
      <Stack pt={5} width="100%" justifyContent="center" alignItems="center" position="relative">
        <Stack alignSelf="center" direction="column" maxWidth="lg" spacing={2} justifyContent="center" alignItems="center">
          <Stack direction="column" spacing={3} justifyContent="center" alignItems="center" textAlign="center">
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
                  ? 'These are all our current events. Click one to manage.'
                  : 'We currently have no events scheduled. Create one.'
              }
            </Typography>
          </Stack>
          <Grid container width="100%" spacing={2} justifyContent={isSmallScreen ? 'center' : 'start'}>
            {
              map(events, (event, i) => {
                const eventPagePath = `/events/${event.uuid}`;

                return (
                  <Grid item key={event.uuid} style={{ padding: '1rem 10px' }}>
                    <Card sx={{ maxWidth: 280, height: '100%' }}>
                      <CardActionArea sx={{ display: 'flex', flexDirection: 'column' }} onClick={() => router.push(eventPagePath)}>
                        <CardMedia
                          sx={{ width: '140px', height: '140px' }}
                          component="img"
                          height="140"
                          width="140"
                          image={event.logo}
                          alt={event.name}
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h5" component="div" textAlign="center">
                            {event.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {event.description}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })
            }
          </Grid>
        </Stack>
      </Stack>
    </>
  );  
};
