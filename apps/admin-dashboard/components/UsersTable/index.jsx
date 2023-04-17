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
import getReadableTicketNumber from '../../lib/helpers/getReadableTicketNumber';

function getValueRenderer(fieldType) {
  if (fieldType === 'text') {
    return (value) => value;
  } else if (fieldType === 'checkbox') {
    return (value = []) => value.join(', ');
  } else if (fieldType === 'date') {
    return (value) => value ? moment(value).format('LLL') : '';
  } else if (fieldType === 'address') {
    return (value) => value && typeof value === 'object' ? Object.keys(value).sort().map((key) => value[key]).join(' ') : value || '';
  }

  return (value) => value;
};

const initialColumns = [
  {
    id: 'first_name',
    type: 'text',
    disablePadding: false,
    label: 'First Name'
  },
  {
    id: 'last_name',
    type: 'text',
    disablePadding: false,
    label: 'Last Name'
  },
  {
    id: 'email',
    type: 'text',
    disablePadding: false,
    label: 'Email'
  },
  {
    id: 'phone_number',
    type: 'text',
    disablePadding: false,
    label: 'Phone Number',
    hidden: true,
    render: (num) => num ? num.replace(/^(\+\d{1,2}\s)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/g, '$1 ($2) $3-$4') : '',
  },
  {
    id: 'date_of_birth',
    type: 'date',
    disablePadding: false,
    label: 'Date of Birth',
    hidden: true,
    render: (dob) => moment(dob, true).isValid() ? moment(dob).format('LL') : 'Unkown',
  },
  {
    id: 'age',
    type: 'number',
    disablePadding: false,
    label: 'Age'
  },
  {
    id: 'registration_number',
    type: 'number',
    disablePadding: false,
    label: 'Registration Number'
  },
  {
    id: 'ticket_issued',
    type: 'boolean',
    disablePadding: false,
    disableSorting: true,
    label: 'Ticket Issued',
    render: (issued) => issued ? 'Yes' : 'No'
  },
  {
    id: 'ticket_number',
    type: 'number',
    disablePadding: false,
    label: 'Ticket Number',
    render: getReadableTicketNumber,
    hidden: true,
  },
  {
    id: 'created_on',
    type: 'date',
    disablePadding: false,
    label: 'Registration Time',
    render: (time) => moment(time).format('LLL')
  },
  {
    id: 'updated_on',
    type: 'date',
    disablePadding: false,
    label: 'Updated On',
    render: (time) => moment(time).format('LLL'),
    hidden: true,
  }
];

const UsersTableToolbar = (props) =>
  <Toolbar
    sx={{
      pl: { sm: 2 },
      pr: { xs: 1, sm: 1 }
    }}
  >
    <Typography
      component="div"
      id="users-table-title"
      sx={{ flex: '1 1 100%', maxWidth: '200px' }}
      variant="h6"
    >
        Registered Users
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
        control={<Checkbox checked={props.paidInFullOnly} indeterminate={props.indeterminate} />}
        label="Ticket Issued"
        labelPlacement="start"
        onChange={props.onPaidInFullClick}
        sx={{ width: '175px', marginRight: '1rem' }}
      />
    </Stack>
  </Toolbar>
  ;

UsersTableToolbar.propTypes = {
  indeterminate: PropTypes.bool,
  onPaidInFullClick: PropTypes.func,
  paidInFullOnly: PropTypes.bool,
  searchValue: PropTypes.string,
  setSearchValue: PropTypes.func
};

UsersTableToolbar.defaultProps = {
  searchValue: '',
  setSearchValue: () => {}
};

function UsersTable({ loading, users, usersEvent, updatePayment, updateUser }) {
  const [ rows, setRows ] = useState([]);
  const [ searchValue, setSearchValue ] = useState('');
  const [ selectedUserUuid, setSelectedUserUuid ] = useState('');
  const [ paidInFullOnly, setPaidInFullOnly ] = useState(false);
  const [ indeterminate, setIndeterminate ] = useState(false);

  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(() => {
    setIsLoading(loading);
  }, [ loading ]);

  const columns = useMemo(() => {
    const additionalUserInfo = filter(get(usersEvent, 'registration_form_fields', {}), (field) => field.can_delete)

    const additionalColumns = map(additionalUserInfo, (additionalField) => {
      const { field_label, field_name, field_type } = additionalField;

      const columnId = `additional_information.${field_name}`;

      return {
        id: columnId,
        type: field_type,
        disablePadding: false,
        label: field_label,
        render: getValueRenderer(field_type),
        hidden: true
      };
    });

    return [
      ...initialColumns,
      ...additionalColumns
    ];
  }, [ usersEvent ]);

  useEffect(() => {
    const searchedUsers = filter(users, ({
      first_name, last_name, ticket_issued, email, registration_number, date_of_birth
    }) => {
      const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

      const ticketIssuedCheck = paidInFullOnly ? ticket_issued : indeterminate ? !ticket_issued : true;

      const searchCheck = ticketIssuedCheck && (
        searchRegex.test(first_name) ||
        searchRegex.test(last_name) ||
        searchRegex.test(`${first_name} ${last_name}`) ||
        searchRegex.test(email) ||
        searchRegex.test(registration_number) ||
        searchRegex.test(moment(date_of_birth, true).format('LL'))
      );

      return searchCheck;
    });

    setRows(searchedUsers);
  }, [ users, searchValue, paidInFullOnly, indeterminate, columns ]);

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
        loading={isLoading}
        onRow={onRowClick}
      />
      {
        selectedUserUuid &&
          <UserDialog
            event={usersEvent}
            onClose={() => {
              setSelectedUserUuid('');
            }}
            open={!!selectedUserUuid}
            updatePayment={updatePayment}
            updateUser={updateUser}
            user={find(rows, [ 'uuid', selectedUserUuid ]) || {}}
          />

      }
    </>
  );
};

UsersTable.propTypes = {
  loading: PropTypes.bool,
  users: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]).isRequired,
  usersEvent: PropTypes.object.isRequired,
  updatePayment: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired
};

UsersTable.defaultProps = {
  loading: false
};

function isSameTable(prevProps, nextProps) {
  const isSame = isEqual(prevProps.users, nextProps.users)
    && isEqual(prevProps.usersEvent, nextProps.usersEvent);

  return isSame;
};

export default memo(UsersTable, isSameTable);
