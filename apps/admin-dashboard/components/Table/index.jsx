import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import map from 'lodash/map';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
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

  if (Array.isArray(aVal) && Array.isArray(bVal)) {
    return bVal.length - aVal.length
  }

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

export default function EnhancedTable({ columns, collapseColumnHeader, onRow, onCollapsedRow, loading, data, headerToolbar, style, collapsable, children }) {
  const [ tableColumns, setTableColumns ] = useState(columns);
  const [ rows, setRows ] = useState([]);
  const [ order, setOrder ] = useState('asc');
  const [ orderBy, setOrderBy ] = useState(columns[0]?.id);
  const [ page, setPage ] = useState(0);
  const [ rowsPerPage, setRowsPerPage ] = useState(10);
  const [ collapsed, setCollapsed ] = useState({});

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
    const cols = [ ...columns ]

    if (collapsable) {
      cols.unshift(
        {
          id: 'collapseContent',
          type: 'collapse',
          disablePadding: false,
          // disableSorting: true,
          label: collapseColumnHeader || 'Show more'
        }
      )
    }
    setTableColumns(cols);
  }, [ columns, collapsable, collapseColumnHeader ]);

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
                        <Fragment key={row.uuid}>
                          <TableRow
                            hover
                            onClick={() => onRow(row)}
                            role="checkbox"
                            tabIndex={-1}
                          >
                            {
                              collapsable ? (
                                <TableCell>
                                  {
                                    row.collapseContent?.length ? (
                                      <IconButton
                                        aria-label="expand row"
                                        size="small"
                                        style={{ padding: 0 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCollapsed((prev) => ({
                                            ...prev,
                                            [row.uuid]: !collapsed[row.uuid]
                                          }))
                                        }}
                                      >
                                        {collapsed[row.uuid] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                      </IconButton>
                                    ) : "0"
                                  }
                                </TableCell>
                              ) : null
                            }
                            {
                              map(tableColumns, ({ id, hidden, render = (val) => val }) => {
                                if (hidden || id === 'collapseContent') {
                                  return null;
                                }
                                return (
                                  <TableCell align="left" key={id}>{render(get(row, id, ''), row)}</TableCell>
                                );
                              })
                            }
                          </TableRow>
                          <TableRow tabIndex={-1}>
                            <TableCell style={{ padding: '0 0.5rem' }} colSpan={tableColumns.filter(({ hidden }) => !hidden).length}>
                              {
                                row.collapseContent?.length ? (
                                  <Collapse in={collapsed[row.uuid]} timeout="auto" unmountOnExit>
                                    <Box sx={{ margin: 1 }}>
                                      <Typography variant="h6" gutterBottom component="div">
                                        {collapseColumnHeader}
                                      </Typography>
                                      <Table
                                        aria-labelledby="tableTitle"
                                        size="large"
                                        sx={{ minWidth: 'sm', border: '2px solid lightgrey', padding: '0.5rem', margin: '0' }}
                                      >
                                        <TableHead>
                                          <TableRow sx={{ background: 'lightgrey' }}>
                                            {
                                              map(tableColumns, ({ id, hidden, label }) => {
                                                if (hidden || id === 'collapseContent') {
                                                  return null;
                                                }
                                                return (
                                                  <TableCell align="left" key={id}>{label}</TableCell>
                                                );
                                              })
                                            }
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {
                                            row.collapseContent.map(collapseRow => (
                                              <TableRow
                                                key={collapseRow.uuid}
                                                onClick={() => onCollapsedRow(collapseRow)}
                                                tabIndex={-1}
                                                hover
                                                role="checkbox"
                                              >
                                                {
                                                  map(tableColumns, ({ id, hidden, render = (val) => val }) => {
                                                    if (hidden || id === 'collapseContent') {
                                                      return null;
                                                    }
                                                    return (
                                                      <TableCell align="left" key={id}>{render(get(collapseRow, id, ''), collapseRow)}</TableCell>
                                                    );
                                                  })
                                                }
                                              </TableRow>
                                            ))
                                          }
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                ) : null
                              }
                            </TableCell>
                          </TableRow>
                        </Fragment>
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
  collapsable: PropTypes.bool,
  columns: PropTypes.array.isRequired,
  children: PropTypes.node,
  onCollapsedRow: PropTypes.func,
  onRow: PropTypes.func,
  loading: PropTypes.bool,
  data: PropTypes.array,
  headerToolbar: PropTypes.node
};

EnhancedTable.defaultProps = {
  collapsable: false,
  onCollapsedRow: () => {},
  onRow: () => {},
  loading: false,
  data: [],
  headerToolbar: null,
  children: null
};
