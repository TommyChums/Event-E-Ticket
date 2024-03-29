import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import map from 'lodash/map';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import visuallyHidden from '@mui/utils/visuallyHidden';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import MenuList from '@mui/material/Menu';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';

function descendingComparator(a, b, orderBy) {
  let aVal = get(a, orderBy);
  let bVal = get(b, orderBy);

  const momAVal = moment(aVal, true);
  const momBVal = moment(bVal, true);

  if (typeof aVal === 'string') {
    aVal = aVal.toLowerCase();
  }
  if (typeof bVal === 'string') {
    bVal = bVal.toLowerCase();
  }


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

function EnhancedTableHead(props) {
  const { columns, order, orderBy, onRequestSort } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead style={{ position: 'relative' }}>
      <TableRow>
        {map(columns, (column) => {
          if (column.hidden) {
            return null;
          }
          return (
            <TableCell
              align="left"
              key={column.id}
              padding={column.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === column.id ? order : false}
              // align={column.numeric ? 'right' : 'left'}
            >
              <TableSortLabel
                active={column.disableSorting ? false : orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                disabled={column.disableSorting}
                hideSortIcon={column.disableSorting}
                onClick={column.disableSorting ? null : createSortHandler(column.id)}
              >
                {column.label}
                {orderBy === column.id ?
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                  : null}
              </TableSortLabel>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  columns: PropTypes.array.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf([ 'asc', 'desc' ]).isRequired,
  orderBy: PropTypes.string.isRequired
};

export default function EnhancedTable({ columns, onRow, loading, data, headerToolbar, style, children }) {
  const [ tableColumns, setTableColumns ] = useState(columns);
  const [ rows, setRows ] = useState([]);
  const [ order, setOrder ] = useState('asc');
  const [ orderBy, setOrderBy ] = useState(columns[0]?.id);
  const [ page, setPage ] = useState(0);
  const [ rowsPerPage, setRowsPerPage ] = useState(10);

  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(() => {
    setIsLoading(loading);
  }, [ loading ]);

  const [ anchorEl, setAnchorEl ] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleColumnVisibility = (id, hidden) => {
    const tmpArr = [ ...tableColumns ];
    const index = findIndex(tmpArr, [ 'id', id ]);

    (tmpArr[index] || {}).hidden = !hidden;

    setTableColumns(tmpArr);
  };

  useEffect(() => {
    setTableColumns(columns);
  }, [ columns ]);

  useEffect(() => {
    setRows(data);
  }, [ data ]);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <>
      <Box sx={{ width: '100%' }} style={style}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          {
            headerToolbar
          }
          <TableContainer>
            <Table
              aria-labelledby="tableTitle"
              size="medium"
              sx={{ minWidth: 'sm' }}
            >
              <EnhancedTableHead
                columns={tableColumns}
                onRequestSort={handleRequestSort}
                order={order}
                orderBy={orderBy}
                rowCount={rows.length}
              />
              <TableBody>
                {
                  isLoading ?
                    <TableRow key="empty-row">
                      <TableCell colSpan={5}>
                        <Skeleton height={53} sx={{ bgcolor: 'grey' }} variant="rectangular"/>
                      </TableCell>
                    </TableRow>
                    :
                    rows.slice().sort(getComparator(order, orderBy))
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) =>
                        <TableRow
                          hover
                          key={row.uuid}
                          onClick={() => onRow(row)}
                          role="checkbox"
                          tabIndex={-1}
                        >
                          {
                            map(tableColumns, ({ id, hidden, render = (val) => val }) => {
                              if (hidden) {
                                return null;
                              }
                              return (
                                <TableCell align="left" key={id}>{render(get(row, id, ''), row)}</TableCell>
                              );
                            })
                          }
                        </TableRow>
                      )

                }
                {emptyRows > 0 &&
                  <TableRow
                    style={{
                      height: 53 * emptyRows
                    }}
                  >
                    <TableCell colSpan={tableColumns.length} />
                  </TableRow>
                }
              </TableBody>
            </Table>
          </TableContainer>
          <div style={{ position: 'relative' }}>
            <TablePagination
              component="div"
              count={rows.length}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[ 5, 10, 25, 50 ]}
              style={{
                marginRight: '4rem'
              }}
            />
            <IconButton
              aria-controls={open ? 'long-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              aria-label="more"
              id="long-button"
              onClick={handleClick}
              style={{
                position: 'absolute',
                top: '5px',
                right: '1.5rem'
              }}
            >
              <VisibilityIcon />
            </IconButton>
            <MenuList
              MenuListProps={{
                'aria-labelledby': 'long-button'
              }}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 0,
                horizontal: 'left'
              }}
              id="long-menu"
              onClose={handleClose}
              open={open}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
            >
              {map(columns, (column) =>
                <MenuItem
                  key={column.id}
                  onClick={() => handleToggleColumnVisibility(column.id, column.hidden)}
                >
                  <ListItemIcon>
                    { column.hidden ? <VisibilityOffIcon /> : <VisibilityIcon /> }
                  </ListItemIcon>
                  <ListItemText>
                    {column.label}
                  </ListItemText>
                </MenuItem>
              )}
            </MenuList>
          </div>
          {children}
        </Paper>
      </Box>
    </>
  );
};

EnhancedTable.propTypes = {
  columns: PropTypes.array.isRequired,
  children: PropTypes.node,
  onRow: PropTypes.func,
  loading: PropTypes.bool,
  data: PropTypes.array,
  headerToolbar: PropTypes.node
};

EnhancedTable.defaultProps = {
  onRow: () => {},
  loading: false,
  data: [],
  headerToolbar: null,
  children: null
};
