import { useEffect, useState, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import reduce from 'lodash/reduce';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';

import Table from '../Table';

const columns = [
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
    id: 'amount',
    type: 'number',
    disablePadding: false,
    label: 'Amount',
    render: (amt) => `$${amt}.00`,
  },
  {
    id: 'timestamp',
    type: 'text',
    disablePadding: false,
    label: 'Paid On',
    render: (time) => moment(time).format('LLL'),
  },
];

function isEarlyBird(paymentDate, earlyBirdDate) {
  if (!earlyBirdDate) return true;

  return moment(paymentDate, true).isSameOrBefore(moment(earlyBirdDate, true));
};

const PaymentsTableToolbar = (props) => {
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
        User Payments
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
          control={<Checkbox checked={props.earlyBirdOnly} indeterminate={props.indeterminate} />}
          onChange={props.onEarlyBirdClick}
          label="Early Bird"
          labelPlacement="start"
        />
      </Stack>
    </Toolbar>
  );
};

PaymentsTableToolbar.propTypes = {
  indeterminate: PropTypes.bool,
  onPaidInFullClick: PropTypes.func,
  paidInFullOnly: PropTypes.bool,
  searchValue: PropTypes.string,
  setSearchValue: PropTypes.func,
};

PaymentsTableToolbar.defaultProps = {
  searchValue: '',
  setSearchValue: () => {},
};

function PaymentsTable({ loading, payments, usersEvent }) {
  const [ rows, setRows ] = useState([]);
  const [ searchValue, setSearchValue ] = useState('');
  const [ earlyBirdOnly, setEarlyBirdOnly ] = useState(false);
  const [ indeterminate, setIndeterminate ] = useState(false);

  const earlyBirdDate = useMemo(() => {
    return get(usersEvent.payment_config, 'early_bird_date', null);
  }, [ usersEvent ]);

  const paymentsTotal = useMemo(() => {
    return reduce(rows, (total, row) => {
      total += row.amount || 0;
      return total;
    }, 0);
  }, [ rows ]);

  useEffect(() => {
    const searchedUsers = filter((payments), ({ first_name, last_name, email, amount, timestamp }) => {
      const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

      const isEarlyBirdResult = isEarlyBird(timestamp, earlyBirdDate);

      const earlyBirdCheck = earlyBirdOnly ? isEarlyBirdResult : indeterminate ? !isEarlyBirdResult : true;

      return earlyBirdCheck && (
        searchRegex.test(first_name) ||
        searchRegex.test(last_name) ||
        searchRegex.test(`${first_name} ${last_name}`) ||
        searchRegex.test(email) ||
        searchRegex.test(amount)
      );
    });

    setRows(searchedUsers);
  }, [ payments, searchValue, earlyBirdOnly, indeterminate, earlyBirdDate ]);

  const handleEarlyBirdClick = ({ target: { checked } }) => {
    if (checked && !earlyBirdOnly && !indeterminate) {
      setEarlyBirdOnly(true);
      setIndeterminate(false);
    } else if (!checked && earlyBirdOnly && !indeterminate) {
      setEarlyBirdOnly(false);
      setIndeterminate(true);
    } else {
      setEarlyBirdOnly(false);
      setIndeterminate(false);
    }
  };

  return (
    <Table
      columns={columns}
      loading={loading}
      data={rows}
      headerToolbar={
        <PaymentsTableToolbar
          indeterminate={indeterminate}
          onEarlyBirdClick={handleEarlyBirdClick}
          earlyBirdOnly={earlyBirdOnly}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      }
    >
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 }
        }}
      >
        <Typography
          sx={{ flex: '1 1 100%', maxWidth: '200px', right: '2rem', position: 'absolute' }}
          variant="h6"
          id="payments-total"
          component="div"
        >
          {`Table Total: $${paymentsTotal}.00`}
        </Typography>
      </Toolbar>
    </Table>
  );
};

PaymentsTable.propTypes = {
  loading: PropTypes.bool,
  payments: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]).isRequired,
  usersEvent: PropTypes.object.isRequired,
  updatePayment: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
};

PaymentsTable.defaultProps = {
  loading: false,
};

function isSameTable(prevProps, nextProps) {
  const isSame = isEqual(prevProps.payments, nextProps.payments);

  return isSame;
};

export default memo(PaymentsTable, isSameTable);
