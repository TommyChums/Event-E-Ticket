import { useEffect, useState, memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import QrCodeReader from 'react-qrcode-reader';
import moment from 'moment';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';
import isEqual from 'lodash/isEqual';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Modal from '@mui/material/Modal';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

import Table from '../Table';
import supabase from '../../lib/supabase';

function getReadableTicketNumber(num) {
  let ticketNumber = num.toString();

  while (ticketNumber.length < 4) {
    ticketNumber = `0${ticketNumber}`;
  };

  return ticketNumber;
};

const columns = [
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
    id: 'registration_number',
    type: 'text',
    disablePadding: false,
    label: 'Registration Number'
  },
  {
    id: 'scanned_in',
    type: 'number',
    disablePadding: false,
    label: 'Ticket Number',
    render: getReadableTicketNumber
  },
  {
    id: 'updated_on',
    type: 'text',
    disablePadding: false,
    label: 'Entered At',
    render: (time) => moment(time).format('LLL')
  }
];

const PaymentsTableToolbar = (props) => {
  const { enqueueSnackbar } = useSnackbar();

  const [ open, setOpen ] = useState(false);
  const [ dataRead, setDataRead ] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleRead = async (qrcodeInfo) => {
    if (!dataRead) {
      setDataRead(true);
      const regNumberTicketNumber = qrcodeInfo.data || '';

      const [ regNumber, ticketNumber ] = regNumberTicketNumber.split('-');

      let invalid = true;

      if (regNumber && ticketNumber) {
        const { data: ticketUser } = await supabase.from('registered-users')
          .select('scanned_in')
          .eq('registration_number', regNumber)
          .single();

        if (ticketUser?.scanned_in) {
          enqueueSnackbar('This ticket was already scanned in', {
            variant: 'error'
          });
        } else if (ticketUser) {
          invalid = false;

          const { data: updatedTicketUser, error } = await supabase.from('registered-users').update({
            scanned_in: +ticketNumber,
            updated_on: moment().toISOString()
          }).eq('registration_number', regNumber).single();

          if (error || !updatedTicketUser) {
            enqueueSnackbar('Error confirming this ticket. Please try again', {
              variant: 'error'
            });
          } else {
            enqueueSnackbar('Valid Ticket', {
              variant: 'success'
            });

            props.updateUser(updatedTicketUser);
          };
        };
      };

      if (invalid) {
        enqueueSnackbar('Invalid Ticket', {
          variant: 'error'
        });
      };

      await new Promise((resolve) => setTimeout(resolve, 500));

      setDataRead(false);
      setOpen(false);
    };
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
        At Event
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
            <IconButton>
              <QrCodeScannerIcon />
            </IconButton>
          }
          label="Scan Ticket"
          labelPlacement="start"
          onClick={() => setOpen(true)}
          sx={{ width: '175px', marginRight: '1rem' }}
        />
      </Stack>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Scan Ticket</DialogTitle>
        <QrCodeReader delay={500} height={400} onRead={handleRead} width={400} />
      </Dialog>
    </Toolbar>
  );
};

PaymentsTableToolbar.propTypes = {
  searchValue: PropTypes.string.isRequired,
  setSearchValue: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired
};

function ScannedInTable({ loading, scannedInUsers, updateUser }) {
  const [ open, setOpen ] = useState(false);
  const [ rows, setRows ] = useState([]);
  const [ searchValue, setSearchValue ] = useState('');

  const randomUser = useRef(null);

  useEffect(() => {
    const searchedUsers = filter(scannedInUsers, ({
      first_name, last_name, registration_number, scanned_in
    }) => {
      const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

      return (
        searchRegex.test(first_name) ||
        searchRegex.test(last_name) ||
        searchRegex.test(`${first_name} ${last_name}`) ||
        searchRegex.test(registration_number) ||
        searchRegex.test(scanned_in)
      );
    });

    setRows(searchedUsers);
  }, [ scannedInUsers, searchValue ]);

  const onRandomClick = () => {
    const randomIndex = Math.floor(Math.random() * scannedInUsers.length);

    randomUser.current = scannedInUsers[randomIndex];

    setOpen(true);
  };

  return (
    <Table
      columns={columns}
      data={rows}
      headerToolbar={
        <PaymentsTableToolbar
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          updateUser={updateUser}
        />
      }
      loading={loading}
    >
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 }
        }}
      >
        <Button
          onClick={onRandomClick}
          size="small"
          style={{
            position: 'absolute',
            right: '2rem'
          }}
          variant="contained"
        >
          Choose Random Ticket
        </Button>
        <Modal
          aria-describedby="modal-modal-description"
          aria-labelledby="modal-modal-title"
          onClose={() => setOpen(false)}
          open={open}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4
            }}
          >
            <Typography component="h2" id="modal-modal-title" variant="h6">
              {
                randomUser.current
                  ? `${randomUser.current.first_name} ${randomUser.current.last_name}`
                  : 'No one'
              }
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              {
                randomUser.current
                  ? `Ticket Number: ${getReadableTicketNumber(randomUser.current.scanned_in)}`
                  : ''
              }
            </Typography>
          </Box>
        </Modal>
      </Toolbar>
    </Table>
  );
};

ScannedInTable.propTypes = {
  loading: PropTypes.bool,
  scannedInUsers: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]).isRequired,
  updateUser: PropTypes.func.isRequired
};

ScannedInTable.defaultProps = {
  loading: false
};

function isSameTable(prevProps, nextProps) {
  const isSame = isEqual(prevProps.scannedInUsers, nextProps.scannedInUsers);
  return isSame;
};

export default memo(ScannedInTable, isSameTable);
