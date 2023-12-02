import { useEffect, useState, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useSnackbar } from 'notistack';
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Table from '../Table';
import UserDialog from '../UserDialog';
import getReadableTicketNumber from '../../lib/helpers/getReadableTicketNumber';
import { makeAuthenticatedPostRequest } from '../../lib/api/makeAuthenticatedRequest';

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

const UsersTableToolbar = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [ columnsForExport, setColumnsForExport ] = useState([]);
  const [ open, setOpen ] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Export Menu
  const [ exportAnchorEl, setExportAnchorEl ] = useState(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  const handleExportMenuClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };
   // Menu
  const [ anchorEl, setAnchorEl ] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (type) => {
    const columnsToExport = props.columns.filter((column) => columnsForExport.includes(column.id));

    const fileType = type === 'csv' ? 'CSV File' : 'Excel File';

    enqueueSnackbar(`Generating ${fileType} for export`, { variant: 'info' });

    handleClose();
    setColumnsForExport([]);

    const { error } = await makeAuthenticatedPostRequest('/api/admin/export/registrations', { columns: columnsToExport, event: props.eventUuid, type });
    if (error) {
      console.log(error)
      enqueueSnackbar(error, { variant: 'error' });
    } else {
      enqueueSnackbar('Export file generated. Please check your email', { variant: 'success' });
    }
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
        id="users-table-title"
        sx={{ flex: '1 1 100%', maxWidth: '200px' }}
        variant="h6"
      >
          Registrations
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
          sx={{ width: '175px' }}
        />
        <IconButton onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <MenuItem key='export' onClick={() => { handleClickOpen(); handleMenuClose() }}>
            <FormControlLabel
              control={
                <IconButton>
                  <FileDownloadIcon />
                </IconButton>
              }
              label="Export"
              labelPlacement="end"
            />
          </MenuItem>
        </Menu>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Export</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Select the columns to include in the export.
              A file will be created and emailed to you.
            </DialogContentText>
            <Select
              sx={{ width: '100%' }}
              multiple
              onChange={({ target: { value } }) => setColumnsForExport(value)}
              value={columnsForExport}
              renderValue={(selected) => selected.map((val) => find(props.columns, [ 'id', `${val}` ])?.label).join(', ')}
            >
              {map(props.columns, (column) => {
                const columnLabel = column.label;
                const columnValue = column.id;

                return (
                  <MenuItem key={columnValue} value={columnValue}>
                    <Checkbox checked={columnsForExport.indexOf(columnValue) > -1} />
                    <ListItemText primary={columnLabel} />
                  </MenuItem>
                );
              })}
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleExportMenuClick}>Export</Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={exportMenuOpen}
              onClose={handleExportMenuClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem key='export-csv' onClick={() => { handleExport('csv'); handleExportMenuClose() }}>
                As CSV File
              </MenuItem>
              {/* <MenuItem key='export-xlsx' onClick={() => { handleExport('xlsx'); handleExportMenuClose() }}>
                As Excel File
              </MenuItem> */}
            </Menu>
          </DialogActions>
        </Dialog>
      </Stack>
    </Toolbar>
  );
};

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
            columns={columns}
            eventUuid={usersEvent.uuid}
            indeterminate={indeterminate}
            onPaidInFullClick={handlePaidInFullClick}
            paidInFullOnly={paidInFullOnly}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        }
        loading={isLoading}
        onRow={onRowClick}
        style={{
          position: 'relative'
        }}
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
