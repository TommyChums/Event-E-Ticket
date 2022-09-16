import { useState } from "react";
import PropTypes from 'prop-types';
import Head from 'next/head'
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import isEmpty from 'lodash/isEmpty';

import supabase from "../../lib/supabase";
import protectedRoute from "../../lib/helpers/protectedRoute";
import UsersTable from "../../components/UsersTable";
import useUsers from "../../lib/hooks/useUsers";
import EventForm from "../../components/EventForm";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        children
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

export default function EventManagementPage({ event }) {
  const { isLoading, users, updatePayment, updateUser } = useUsers(event.uuid);
  const [ value, setValue ] = useState(0);

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
            <Stack sx={{ margin: '0 0 2rem' }} direction="column" spacing={1.5}>
              <Avatar alt="" src={event.logo} sx={{ width: 120, height: 120, alignSelf: 'center' }} />
              <Typography variant="h6" fontWeight="bold">
                {event.host}
              </Typography>
              <Typography variant="subtitle1">
                {event.description || `${event.host} presents ${event.name}`}
              </Typography>
            </Stack>
            <EventForm event={event} />
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
    </>
  );
};

export const getServerSideProps = protectedRoute(async ({ params }) => {
  const { data: event } = await supabase.from('events').select('*').eq('uuid', params.eventUuid).single();

  if (isEmpty(event)) {
    return {
      notFound: true,
    };
  }

  const logoLocation = event.logo;

  if (logoLocation) {
    const { publicURL, error } = supabase.storage.from(logoLocation.bucket).getPublicUrl(logoLocation.key);

    if (error) throw error;

    event.logo = publicURL;
  }

  return {
    props: {
      event,
    },
  };
});
