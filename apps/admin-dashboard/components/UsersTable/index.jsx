import { useEffect, useState } from 'react';
import moment from 'moment';
import filter from 'lodash/filter';
import find from 'lodash/find';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import { visuallyHidden } from '@mui/utils';

import UserDialog from '../UserDialog';

function descendingComparator(a, b, orderBy) {
  let aVal = a[orderBy];
  let bVal = b[orderBy];

  const momAVal = moment(aVal, true);
  const momBVal = moment(bVal, true);

  if (typeof aVal === 'string') aVal = aVal.toLowerCase();
  if (typeof bVal === 'string') bVal = bVal.toLowerCase();


  if (momAVal.isValid() && momBVal.isValid()) {
    if (momBVal.isBefore(momAVal)) {
      return -1;
    }
    if (momBVal.isAfter(momAVal)) {
      return 1;
    }
  }

  if (bVal < aVal) {
    return -1;
  }
  if (bVal > aVal) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
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
    id: 'age',
    type: 'number',
    disablePadding: false,
    label: 'Age',
  },
  {
    id: 'ticket_issued',
    type: 'boolean',
    disablePadding: false,
    disableSorting: true,
    label: 'Paid In Full',
  },
  {
    id: 'updated_on',
    type: 'text',
    disablePadding: true,
    label: 'Updated On',
  },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            // align={headCell.numeric ? 'right' : 'left'}
            align="left"
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={headCell.disableSorting ? false : orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={headCell.disableSorting ? null : createSortHandler(headCell.id)}
              hideSortIcon={headCell.disableSorting}
              disabled={headCell.disableSorting}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const EnhancedTableToolbar = (props) => {
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
          onChange={({ target }) => props.setSearchValue(target.value)}
          size="small"
          value={props.searchValue}
        />
        <FormControlLabel
          sx={{ width: '175px', marginRight: '1rem' }}
          control={<Checkbox checked={props.paidInFullOnly} indeterminate={props.indeterminate} />}
          onChange={props.onPaidInFullClick}
          label="Paid in full"
          labelPlacement="start"
        />
      </Stack>
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  indeterminate: PropTypes.bool,
  onPaidInFullClick: PropTypes.func,
  paidInFullOnly: PropTypes.bool,
  searchValue: PropTypes.string,
  setSearchValue: PropTypes.func,
};

EnhancedTableToolbar.defaultProps = {
  searchValue: '',
  setSearchValue: () => {},
};

export default function EnhancedTable({ loading, users, usersEvent, updatePayment, updateUser }) {
  const [ dialogOpen, setDialogOpen ] = useState(false);
  const [ rows, setRows ] = useState([]);
  const [ order, setOrder ] = useState('asc');
  const [ orderBy, setOrderBy ] = useState('first_name');
  const [ page, setPage ] = useState(0);
  const [ rowsPerPage, setRowsPerPage ] = useState(10);
  const [ searchValue, setSearchValue ] = useState('');
  const [ selectedUserUuid, setSelectedUserUuid ] = useState('');
  const [ paidInFullOnly, setPaidInFullOnly ] = useState(false);
  const [ indeterminate, setIndeterminate ] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event, uuid) => {
    setSelectedUserUuid(uuid);
    setDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  useEffect(() => {
    const searchedUsers = filter((users), ({ first_name, last_name, ticket_issued }) => {
      const searchRegex = new RegExp(searchValue, 'i');

      const ticketIssuedCheck = paidInFullOnly ? ticket_issued : indeterminate ? !ticket_issued : true;

      return ticketIssuedCheck && (searchRegex.test(first_name) || searchRegex.test(last_name));
    });

    setRows(searchedUsers);
  }, [ users, searchValue, paidInFullOnly, indeterminate ]);

  useEffect(() => {
    setPage(0);
  }, [ searchValue, paidInFullOnly, indeterminate ]);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <EnhancedTableToolbar
            indeterminate={indeterminate}
            onPaidInFullClick={handlePaidInFullClick}
            paidInFullOnly={paidInFullOnly}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          <TableContainer>
            <Table
              sx={{ minWidth: 750 }}
              aria-labelledby="tableTitle"
              size="medium"
            >
              <EnhancedTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
              />
              <TableBody>
                { 
                  loading ? (
                    <TableRow key="empty-row">
                      <TableCell colSpan={5}>
                        <Skeleton sx={{ bgcolor: 'grey' }} height={53} variant="rectangular"/>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice().sort(getComparator(order, orderBy))
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => {
                        return (
                          <TableRow
                            hover
                            onClick={(event) => handleClick(event, row.uuid)}
                            role="checkbox"
                            tabIndex={-1}
                            key={row.uuid}
                          >
                            <TableCell align="left">{row.first_name}</TableCell>
                            <TableCell align="left">{row.last_name}</TableCell>
                            <TableCell align="left">{row.age}</TableCell>
                            <TableCell align="left">{row.ticket_issued ? 'Yes' : 'No' }</TableCell>
                            <TableCell align="left">{moment(row.updated_on).format('LLL')}</TableCell>
                          </TableRow>
                        );
                      })
                  )
                }
                {emptyRows > 0 && (
                  <TableRow
                    style={{
                      height: (53) * emptyRows,
                    }}
                  >
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
      {
        selectedUserUuid && (
          <UserDialog
            onClose={() => {
              setDialogOpen(false);
              setSelectedUserUuid('');
            }}
            open={dialogOpen}
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
