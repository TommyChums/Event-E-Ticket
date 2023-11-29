import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import PlaceIcon from '@mui/icons-material/Place';
import useMediaQuery from '@mui/material/useMediaQuery';

import Can from '../../components/Can';
import UsersTable from '../../components/UsersTable';
import TabPanel from '../../components/TabPanel';
import EventForm from '../../components/EventForm';
import PaymentsTable from '../../components/PaymentsTable';
import ScannedInTable from '../../components/ScannedInTable';

import { useEvent } from '../../lib/state/selectors/events';
import protectedRoute from '../../lib/helpers/protectedRoute';
import useDispatch from '../../lib/hooks/useDispatch';
import { updateEvent } from '../../lib/state/actions/events';
import { useEventPayments, useEventUsers, useScannedInUsers } from '../../lib/state/selectors/eventUsers';
import { paymentUpdate, updateEventUser } from '../../lib/state/actions/eventUsers';
import CONSTANTS from '../../lib/state/constants';
import useCan from '../../lib/hooks/useCan';

const {
  RBAC: {
    ACTIONS,
    SUBJECTS,
  },
} = CONSTANTS;

const TABS = [
  {
    action: ACTIONS.EDIT,
    subject: SUBJECTS.EVENTS, 
    label: 'Config',
    value: 'config',
  },
  {
    action: ACTIONS.VIEW,
    subject: SUBJECTS.USERS, 
    label: 'Registrations',
    value: 'users',
  },
  {
    action: ACTIONS.VIEW,
    subject: SUBJECTS.PAYMENTS, 
    label: 'Payments',
    value: 'payments',
  },
  {
    action: ACTIONS.SCAN,
    subject: SUBJECTS.TICKETS, 
    label: 'Check Ins',
    value: 'at_event',
    icon: <PlaceIcon fontSize="small" />,
    iconPosition: "start",
    sx: { minHeight: 0 },
  },
];

export default function EventManagementPage() {
  const { can } = useCan();
  const router = useRouter();
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery('(max-width:900px)');

  const { eventUuid } = router.query;

  const { event, loading: eventLoading } = useEvent(eventUuid);
  const { eventUsers: users, loading: usersLoading } = useEventUsers(eventUuid);
  const { payments } = useEventPayments(eventUuid);
  const { scannedInUsers } = useScannedInUsers(eventUuid);

  const [ value, setValue ] = useState(event.is_published ? 'users' : 'config');

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  const getTabs = () => {
    const tabsArr = [];
    TABS.forEach(({ action, subject, sx, ...tab}) => {
      if (can(action, subject)) {
        tabsArr.push(
          <Tab sx={{
            fontSize: isSmallScreen ? '11px' : '15px',
            ...sx
          }} {...tab}/>
        )
      }
    });

    return tabsArr;
  };

  return (
    <>
      <Head>
        <title>{`Manage | ${event.name} | Admin Dashboard`}</title>
        <meta content={`Manage | ${event.name} | Admin Dashboard`} key="title" property="og:title" />
        <link href={event.logo || '/images/rlc-logo.ico'} rel="icon" type="image/x-icon" />
      </Head>
      { !eventLoading ?
        <Box sx={{ width: '100%', typography: 'body1' }}>
          <Box sx={{ width: '100%' }}>
            <Tabs
              aria-label={`${event?.name} Menu`}
              onChange={handleChange}
              value={value}
              variant="fullWidth"
            >
              { getTabs() }
            </Tabs>
          </Box>
          <Can I={ACTIONS.EDIT} A={SUBJECTS.EVENTS}>
            <TabPanel index="config" value={value}>
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
                <EventForm event={event} onSave={(data) => dispatch(updateEvent(data))}/>
              </Container>
            </TabPanel>
          </Can>
          <Can I={ACTIONS.VIEW} A={SUBJECTS.USERS}>
            <TabPanel index="users" value={value}>
              <UsersTable
                loading={usersLoading}
                updatePayment={(data) => dispatch(paymentUpdate({ payment: data, eventUuid }))}
                updateUser={(data) => dispatch(updateEventUser({ user: data, eventUuid }))}
                users={users}
                usersEvent={event}
              />
            </TabPanel>
          </Can>
          <Can I={ACTIONS.VIEW} A={SUBJECTS.PAYMENTS}>
            <TabPanel index="payments" value={value}>
              <PaymentsTable
                loading={usersLoading}
                payments={payments}
                usersEvent={event}
              />
            </TabPanel>
          </Can>
          <Can I={ACTIONS.SCAN} A={SUBJECTS.TICKETS}>
            <TabPanel index="at_event" value={value}>
              <ScannedInTable
                loading={usersLoading}
                scannedInUsers={scannedInUsers}
                updateUser={(data) => dispatch(updateEventUser({ user: data, eventUuid }))}
                users={users}
                usersEvent={event}
              />
            </TabPanel>
          </Can>
        </Box>
        :
        <Backdrop open sx={{ color: '#fff' }}>
          <CircularProgress />
        </Backdrop>
      }
    </>
  );
};

export const getServerSideProps = protectedRoute(async ({ query }, { supabase }) => {
  const { count } = await supabase.from('events')
    .select(undefined, { count: 'exact', head: true })
    .eq('uuid', query.eventUuid);

  if (count) {
    return { props: {} };
  }

  return { notFound: true };
});
