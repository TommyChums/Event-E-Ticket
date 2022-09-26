import { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { useRouter } from "next/router";
import Head from 'next/head'
import isEmpty from 'lodash/isEmpty';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';;
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs'

import UsersTable from "../../components/UsersTable";
import TabPanel from '../../components/TabPanel';
import EventForm from "../../components/EventForm";

import useUsers from "../../lib/hooks/useUsers";
import useEvent from "../../lib/hooks/useEvent";
import protectedRoute from "../../lib/helpers/protectedRoute";

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

export default function EventManagementPage() {
  const router = useRouter()
  const { eventUuid } = router.query
  const { event, isLoading: eventLoading, updateEvent } = useEvent(eventUuid);
  const { isLoading: usersLoading, users, updatePayment, updateUser } = useUsers(eventUuid);
  const [ value, setValue ] = useState(0);

  const [ isLoading, setIsLoading ] = useState(usersLoading || eventLoading);

  useEffect(() => {
    if (eventLoading || usersLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [ eventLoading, usersLoading ]);

  const handleChange = (event, newValue) => {
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
                <EventForm event={event} onSave={updateEvent}/>
              </Container>
            </TabPanel>
            <TabPanel index={1} value={value}>
              <UsersTable
                loading={isLoading}
                users={users}
                usersEvent={event}
                updatePayment={updatePayment}
                updateUser={updateUser}
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
