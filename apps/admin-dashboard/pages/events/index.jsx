import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TabPanel from '../../components/TabPanel';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';

import protectedRoute from '../../lib/helpers/protectedRoute';
import { useEvents } from '../../lib/state/selectors/events';

export const getServerSideProps = protectedRoute();

export default function EventsHome() {
  const { events, loading } = useEvents();
  const [ pastEvents, setPastEvents ] = useState([]);
  const [ currentEvents, setCurrentEvents ] = useState([]);
  const [ isRouting, setRouting ] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width:900px)');
  const router = useRouter();
  
  const [ value, setValue ] = useState(1);
  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    const pEs = [];
    const cEs = [];

    forEach(events, (event) => {
      if (moment(event.end_date).isBefore(moment())) {
        pEs.push(event);
      } else {
        cEs.push(event);
      }
    });

    setPastEvents(pEs);
    setCurrentEvents(cEs);
  }, [ events ]);

  const pushToPage = (pathName) => {
    setRouting(true);

    router.push(pathName).then(() => {
      setRouting(false);
    });
  };

  return (
    <>
      <Head>
        <title>Events | Admin Dashboard | Reformation Life Centre - Events</title>
        <meta content="Reformation Life Centre - Events" key="title" property="og:title" />
        <link href="/images/rlc-logo.ico" rel="icon" type="image/x-icon" />
      </Head>
      <Backdrop open={isRouting || loading} sx={{ color: '#fff', zIndex: 5 }}>
        <CircularProgress />
      </Backdrop>
      <Stack alignItems="center" justifyContent="center" position="relative" pt={5} width="100%">
        <Stack
          alignItems="center"
          alignSelf="center"
          direction="column"
          justifyContent="center"
          maxWidth="lg"
          spacing={2}
          style={{
            width: '100%'
          }}
        >
          <Stack
            alignItems="center"
            direction="column"
            justifyContent="center"
            spacing={3}
            textAlign="center"
          >
            <Typography
              color="text.primary"
              component="span"
              sx={{ display: 'inline' }}
              variant="h5"
            >
              {
                isEmpty(events)
                  ? 'Create an event to manage.'
                  : 'Select an event to manage.'
              }
            </Typography>
          </Stack>
          {
            !isEmpty(events) && (
              <>
                <Box sx={{ width: '100%' }}>
                  <Tabs
                    aria-label="Events Menu"
                    onChange={handleChange}
                    value={value}
                    variant="fullWidth"
                  >
                    <Tab label="Past Events" value={0} />
                    <Tab label="Current Events" value={1} />
                  </Tabs>
                </Box>
                <TabPanel fullWidth index={0} value={value}>
                  <Grid container justifyContent={isSmallScreen ? 'center' : 'start'} spacing={2} width="100%">
                    {
                      map(pastEvents, (event) => {
                        const eventPagePath = `/events/${event.uuid}`;

                        return (
                          <Grid item key={event.uuid} style={{ padding: '1rem 10px' }}>
                            <Card sx={{ width: 280, height: '100%' }}>
                              <CardActionArea
                                onClick={() => pushToPage(eventPagePath)}
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'start',
                                  height: '100%'
                                }}
                              >
                                <CardMedia
                                  alt={event.name}
                                  component="img"
                                  height="140"
                                  image={event.logo}
                                  sx={{ width: '140px', height: '140px', alignSelf: 'center' }}
                                  width="140"
                                />
                                <CardContent>
                                  <Typography component="div" gutterBottom textAlign="center" variant="h5">
                                    {event.name}
                                  </Typography>
                                  <Typography color="text.secondary" variant="body2">
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
                </TabPanel>
                <TabPanel fullWidth index={1} value={value}>
                  <Grid container justifyContent={isSmallScreen ? 'center' : 'start'} spacing={2} width="100%">
                    {
                      map(currentEvents, (event) => {
                        const eventPagePath = `/events/${event.uuid}`;

                        return (
                          <Grid item key={event.uuid} style={{ padding: '1rem 10px' }}>
                            <Card sx={{ width: 280, height: '100%' }}>
                              <CardActionArea
                                onClick={() => pushToPage(eventPagePath)}
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'start',
                                  height: '100%'
                                }}
                              >
                                <CardMedia
                                  alt={event.name}
                                  component="img"
                                  height="140"
                                  image={event.logo}
                                  sx={{ width: '140px', height: '140px', alignSelf: 'center' }}
                                  width="140"
                                />
                                <CardContent>
                                  <Typography component="div" gutterBottom textAlign="center" variant="h5">
                                    {event.name}
                                  </Typography>
                                  <Typography color="text.secondary" variant="body2">
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
                </TabPanel>
              </>
            )
          }
        </Stack>
      </Stack>
    </>
  );
};
