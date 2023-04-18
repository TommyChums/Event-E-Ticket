import { useEffect, useState } from 'react';
import Head from 'next/head';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';
import find from 'lodash/find';
import startCase from 'lodash/startCase';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { makeAuthenticatedGetRequest } from '../lib/api/makeAuthenticatedRequest';
import protectedRoute from '../lib/helpers/protectedRoute';
import { useAdminUsers } from '../lib/state/selectors/adminUsers';
import useDispatch from '../lib/hooks/useDispatch';
import isAdminUser from '../lib/helpers/isAdminUser';
import {
  adminUsersErrorAction,
  adminUsersLoadingAction,
  receivedAdminUsersAction,
  updateAdminUser,
} from '../lib/state/actions/adminUsers';
import Table from '../components/Table';
import AdminUserDialog from '../components/AdminUserDialog';
import moment from 'moment';

const columns = [
  {
    id: 'email',
    type: 'text',
    disablePadding: false,
    label: 'Email'
  },
  {
    id: 'user_metadata.first_name',
    type: 'text',
    disablePadding: false,
    label: 'First Name'
  },
  {
    id: 'user_metadata.last_name',
    type: 'text',
    disablePadding: false,
    label: 'Last Name'
  },
  {
    id: 'app_metadata.role',
    type: 'text',
    disablePadding: false,
    label: 'Role',
    render: (val) => startCase(val),
  },
  {
    id: 'app_metadata.allowed_events_names',
    type: 'text',
    disablePadding: false,
    label: 'Allowed Events',
    render: (value = []) => (value || []).join(', '),
  },
  {
    id: 'last_sign_in_at',
    type: 'text',
    disablePadding: false,
    label: 'Last Login',
    render: (value) => value ? moment(value).format('LLLL') : 'Never',
  },
];

const DashboardUserTableToolbar = (props) => {
  // const supabase = useSupabaseClient();

  // const { enqueueSnackbar } = useSnackbar();

  const [ open, setOpen ] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 }
      }}
    >
      <Typography
        component="div"
        id="tableTitle"
        sx={{ flex: '1 1 100%', maxWidth: '200px' }}
        variant="h6"
      >
        Dashboard Users
      </Typography>
      <Stack
        direction="row"
        sx={{ width: '100%' }}
      >
        <TextField
          fullWidth
          id="outlined-search"
          label="Search"
          onChange={({ target }) => {
            const { value } = target;

            props.setSearchValue(value.trimStart());
          }}
          size="small"
          value={props.searchValue}
        />
        <FormControlLabel
          control={
            <IconButton style={{ color: 'white' }}>
              <PersonAddIcon />
            </IconButton>
          }
          label="New User"
          labelPlacement="start"
          onClick={() => setOpen(true)}
          sx={{
            width: '135px',
            marginRight: '1rem',
            backgroundColor: '#673ab7',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
          }}
        />
      </Stack>
      <AdminUserDialog
        eventsById={props.eventsById}
        onClose={handleClose}
        open={open}
        updateUser={props.updateUser}
        user={{}}
      />
    </Toolbar>
  );
};

export default function AdminUsersHome() {
  const { users, loading, error } = useAdminUsers();
  const dispatch = useDispatch();
  
  const [ adminUsers, setAdminUsers ] = useState(Object.values(users || {}));

  const [ selectedUserUuid, setSelectedUserUuid ] = useState();
  const [ eventsById, setEventsById ] = useState({});

  const [ searchValue, setSearchValue ] = useState('');


  useEffect(() => {
    dispatch(adminUsersLoadingAction(true))
    makeAuthenticatedGetRequest('/api/admin/get-users').then(( { data }) => {
      dispatch(receivedAdminUsersAction(data?.users));
      setEventsById(data?.eventsById)
    }).catch((err) => dispatch(adminUsersErrorAction(err)));
  }, [ dispatch ]);

  useEffect(() => {
    setAdminUsers(Object.values(users || {}));
  }, [ users ]);

  useEffect(() => {
    const searchedUsers = filter(users, ({ email, user_metadata: { first_name, last_name } }) => {
      const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

      return (
        searchRegex.test(email) ||
        searchRegex.test(first_name) ||
        searchRegex.test(last_name) ||
        searchRegex.test(`${first_name} ${last_name}`)
      );
    });

    setAdminUsers(searchedUsers);
  }, [ users, searchValue ]);

  const updateUser = (user) => dispatch(updateAdminUser(user));

  const onRowClick = ({ id }) => {
    setSelectedUserUuid(id);
  };

  return (
    <>
      <Head>
        <title> Admin Users | Admin Dashboard | Reformation Life Centre - Admin Users</title>
        <meta content="Reformation Life Centre - AdminUsers" key="title" property="og:title" />
        <link href="/images/rlc-logo.ico" rel="icon" type="image/x-icon" />
      </Head>
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: 5 }}>
        <CircularProgress />
      </Backdrop>
      <Table
        columns={columns}
        data={adminUsers}
        headerToolbar={
          <DashboardUserTableToolbar
            eventsById={eventsById}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            updateUser={updateUser}
          />
        }
        loading={loading}
        onRow={onRowClick}
      />
      {
        selectedUserUuid &&
          <AdminUserDialog
            eventsById={eventsById}
            onClose={() => {
              setSelectedUserUuid('');
            }}
            open={!!selectedUserUuid}
            updateUser={updateUser}
            user={find(adminUsers, [ 'id', selectedUserUuid ]) || {}}
          />
      }
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
