import { useEffect, useState, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';
import find from 'lodash/find';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import startCase from 'lodash/startCase';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';

import Table from '../Table';
import UserDialog from '../UserDialog';

function getValueRenderer(fieldType) {
  if (fieldType === 'text') {
    return (value) => value;
  } else if (fieldType === 'checkbox') {
    return (value = []) => value.join(', ');
  } else if (fieldType === 'date') {
    return (value) => value ? moment(value).format('LLL') : '';
  }

  return (value) => value;
};

const initialColumns = [
  {
    id: 'first_name',
    type: 'text',
    disablePadding: false,
    label: 'First Name',
  },
  {
    id: 'last_name',
    type: 'text',
    disablePadding: false,
    label: 'Last Name',
  },
  {
    id: 'email',
    type: 'text',
    disablePadding: false,
    label: 'Email',
  },
  {
    id: 'age',
    type: 'number',
    disablePadding: false,
    label: 'Age',
  },
  {
    id: 'registration_number',
    type: 'number',
    disablePadding: true,
    label: 'Registration Number',
  },
  {
    id: 'ticket_issued',
    type: 'boolean',
    disablePadding: false,
    disableSorting: true,
    label: 'Ticket Issued',
    render: (issued) => issued ? 'Yes' : 'No',
  },
  {
    id: 'created_on',
    type: 'text',
    disablePadding: true,
    label: 'Registration Time',
    render: (time) => moment(time).format('LLL'),
  },
];

const UsersTableToolbar = (props) => {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 }
      }}
    >
      <Typography
        sx={{ flex: '1 1 100%', maxWidth: '200px' }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        Registered Users
      </Typography>
      <Stack
        sx={{ width: '100%' }}
        direction="row"
      >
        <TextField
          id="outlined-search"
          fullWidth
          label="Search"
          onChange={({ target }) => {
            const { value } = target;

            props.setSearchValue(value.trimStart());
          }}
          size="small"
          value={props.searchValue}
        />
        <FormControlLabel
          sx={{ width: '175px', marginRight: '1rem' }}
          control={<Checkbox checked={props.paidInFullOnly} indeterminate={props.indeterminate} />}
          onChange={props.onPaidInFullClick}
          label="Ticket Issued"
          labelPlacement="start"
        />
      </Stack>
    </Toolbar>
  );
};

UsersTableToolbar.propTypes = {
  indeterminate: PropTypes.bool,
  onPaidInFullClick: PropTypes.func,
  paidInFullOnly: PropTypes.bool,
  searchValue: PropTypes.string,
  setSearchValue: PropTypes.func,
};

UsersTableToolbar.defaultProps = {
  searchValue: '',
  setSearchValue: () => {},
};

function UsersTable({ loading, users, usersEvent, updatePayment, updateUser }) {
  const [ rows, setRows ] = useState([]);
  const [ searchValue, setSearchValue ] = useState('');
  const [ selectedUserUuid, setSelectedUserUuid ] = useState('');
  const [ paidInFullOnly, setPaidInFullOnly ] = useState(false);
  const [ indeterminate, setIndeterminate ] = useState(false);
  
  const columns = useMemo(() => {
    const additionalUserInfo = get(usersEvent, 'additional_user_information', {});
  
    const additionalColumns = map(additionalUserInfo, (additionalField) => {
      const { field_name, field_type } = additionalField;
  
      const columnId = `additional_information.${field_name}`;
  
      return {
        id: columnId,
        type: field_type,
        disablePadding: false,
        label: startCase(field_name),
        render: getValueRenderer(field_type),
        hidden: true,
      };
    });
  
    return [
      ...initialColumns,
      ...additionalColumns,
    ];
  }, [ usersEvent ]);

  useEffect(() => {
    const searchedUsers = filter((users), ({ first_name, last_name, ticket_issued, email, registration_number }) => {
      const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

      const ticketIssuedCheck = paidInFullOnly ? ticket_issued : indeterminate ? !ticket_issued : true;

      return ticketIssuedCheck && (
        searchRegex.test(first_name) ||
        searchRegex.test(last_name) ||
        searchRegex.test(`${first_name} ${last_name}`) ||
        searchRegex.test(email) ||
        searchRegex.test(registration_number)
      );
    });

    setRows(searchedUsers);
  }, [ users, searchValue, paidInFullOnly, indeterminate ]);

  const handlePaidInFullClick = ({ target: { checked } }) => {
    if (checked && !paidInFullOnly && !indeterminate) {
      setPaidInFullOnly(true);
      setIndeterminate(false);
    } else if (!checked && paidInFullOnly && !indeterminate) {
      setPaidInFullOnly(false);
      setIndeterminate(true);
    } else {
      setPaidInFullOnly(false);
      setIndeterminate(false);
    }
  };

  const onRowClick = ({ uuid }) => {
    setSelectedUserUuid(uuid);
  };

  return (
    <>
      <Table
        columns={columns}
        onRow={onRowClick}
        loading={loading}
        data={rows}
        headerToolbar={
          <UsersTableToolbar
            indeterminate={indeterminate}
            onPaidInFullClick={handlePaidInFullClick}
            paidInFullOnly={paidInFullOnly}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        }
      />
      {
        selectedUserUuid && (
          <UserDialog
            onClose={() => {
              setSelectedUserUuid('');
            }}
            open={!!selectedUserUuid}
            user={find(rows, [ 'uuid', selectedUserUuid ]) || {}}
            event={usersEvent}
            updatePayment={updatePayment}
            updateUser={updateUser}
          />
        )
      }
    </>
  );
};

UsersTable.propTypes = {
  loading: PropTypes.bool,
  users: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]).isRequired,
  usersEvent: PropTypes.object.isRequired,
  updatePayment: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
};

UsersTable.defaultProps = {
  loading: false,
};

function isSameTable(prevProps, nextProps) {
  const isSame = isEqual(prevProps.users, nextProps.users) && isEqual(prevProps.usersEvent, nextProps.usersEvent);

  return isSame;
};

export default memo(UsersTable, isSameTable);
