import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from 'next/head'
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';;
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs'

import UsersTable from "../../components/UsersTable";
import TabPanel from '../../components/TabPanel';
import EventForm from "../../components/EventForm";

import { useEvent } from "../../lib/state/selectors/events";
import protectedRoute from "../../lib/helpers/protectedRoute";
import useDispatch from "../../lib/hooks/useDispatch";
import { updateEvent } from "../../lib/state/actions/events";
import { useEventUsers } from "../../lib/state/selectors/eventUsers";
import { paymentUpdate, updateEventUser } from "../../lib/state/actions/eventUsers";

export default function EventManagementPage() {
  const router = useRouter()
  const dispatch = useDispatch();
  
  const { eventUuid } = router.query

  const { event, loading: eventLoading } = useEvent(eventUuid);
  const { eventUsers: users, loading: usersLoading } = useEventUsers(eventUuid);

  const [ value, setValue ] = useState(0);

  const [ isLoading, setIsLoading ] = useState(usersLoading || eventLoading);

  useEffect(() => {
    if (eventLoading || usersLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [ eventLoading, usersLoading ]);

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Head>
        <title>{`Manage | ${event.name} | Admin Dashboard`}</title>
        <meta property="og:title" content={`Manage | ${event.name} | Admin Dashboard`} key="title" />
        <link rel="icon" type="image/x-icon" href={event.logo || '/images/rlc-logo.ico'} />
      </Head>
      { !eventLoading ? (
          <Box sx={{ width: '100%', typography: 'body1' }}>
            <Box sx={{ width: '100%' }}>
              <Tabs value={value} onChange={handleChange} aria-label={`${event?.name} Menu`} variant="fullWidth" >
                <Tab label="Config" value={0} />
                <Tab label="Users" value={1} />
                <Tab label="Payments" value={2} />
              </Tabs>
            </Box>
            <TabPanel index={0} value={value}>
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
                <EventForm event={event} onSave={(data) => dispatch(updateEvent(data))}/>
              </Container>
            </TabPanel>
            <TabPanel index={1} value={value}>
              <UsersTable
                loading={isLoading}
                users={users}
                usersEvent={event}
                updatePayment={(data) => dispatch(paymentUpdate({ payment: data, eventUuid }))}
                updateUser={(data) => dispatch(updateEventUser({ user: data, eventUuid }))}
              />
            </TabPanel>
            <TabPanel index={2} value={value}>
              <div>Payments</div>
            </TabPanel>
          </Box>
      ) : (
        <Backdrop open sx={{ color: '#fff' }}>
          <CircularProgress />
        </Backdrop>
      )}
    </>
  );
};

export const getServerSideProps = protectedRoute(async ({ query }, authenticatedSupabase) => {
  const { count } = await authenticatedSupabase.from('events').select(undefined, { count: 'exact', head: true }).eq('uuid', query.eventUuid);

  if (count) {
    return { props: {} };
  }

  return { notFound: true };
});
