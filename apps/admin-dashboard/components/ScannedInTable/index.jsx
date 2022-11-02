import { useEffect, useState, memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import moment from 'moment';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';
import find from 'lodash/find';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import useMediaQuery from '@mui/material/useMediaQuery';
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
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import Table from '../Table';
import QrCodeScanner from '../QrCodeScanner';
import RandomWheel from '../RandomWheel';
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
  const dataRead = useRef(false);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      dataRead.current = false;
    }, 500);
  };

  const handleRead = async (qrcodeInfo) => {
    if (!dataRead.current) {
      dataRead.current = true;
      console.log(qrcodeInfo, dataRead.current)
      const regNumberTicketNumber = qrcodeInfo || '';

      const [ regNumber, ticketNumber ] = regNumberTicketNumber.split('-');

      let invalid = true;

      if (regNumber && ticketNumber) {
        const { data: ticketUser } = await supabase.from('registered-users')
          .select('scanned_in')
          .eq('registration_number', regNumber)
          .eq('registered_event', props.usersEvent.uuid)
          .single();

        if (ticketUser?.scanned_in) {
          invalid = false;
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
            setOpen(false);
            dataRead.current = false;
          };
        };
      };

      if (invalid) {
        enqueueSnackbar('Invalid Ticket', {
          variant: 'error'
        });
      };

      setTimeout(() => {
        dataRead.current = false;
      }, 2000);
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
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            Scan Ticket
            <IconButton onClick={handleClose}>
              <HighlightOffIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <QrCodeScanner
          onScan={handleRead}
        />
      </Dialog>
    </Toolbar>
  );
};

PaymentsTableToolbar.propTypes = {
  searchValue: PropTypes.string.isRequired,
  setSearchValue: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  usersEvent: PropTypes.object.isRequired,
};

function ScannedInTable({ loading, scannedInUsers, updateUser, usersEvent }) {
  const isSmallScreen = useMediaQuery('(max-width:780px)');

  const [ open, setOpen ] = useState(false);
  const [ winnerOpen, setWinnerOpen ] = useState(false);
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
          usersEvent={usersEvent}
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
          <>
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: isSmallScreen ? '-23%' : '35%',
              }}
            >
              <IconButton onClick={() => setOpen(false)}>
                <HighlightOffIcon />
              </IconButton>
              <RandomWheel
                onFinished={(winningTicket) => {
                  randomUser.current = find(scannedInUsers, [ 'scanned_in', +winningTicket ]);
                  setWinnerOpen(true);
                }}
                segments={map(scannedInUsers, (user) => getReadableTicketNumber(user.scanned_in))}
              />
            </div>
            <Modal
              aria-describedby="modal-modal-description"
              aria-labelledby="modal-modal-title"
              onClose={() => setWinnerOpen(false)}
              open={winnerOpen}
            >
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isSmallScreen ? 200 : 600,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4
                  }}
                >
                  <IconButton
                    onClick={() => setWinnerOpen(false)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0
                    }}
                  >
                    <HighlightOffIcon />
                  </IconButton>
                  <Typography component="h2" id="modal-modal-title" variant={isSmallScreen ? 'h5' : 'h3'} sx={{ textAlign: 'center' }}>
                    {
                      randomUser.current
                        ? `${randomUser.current.first_name} ${randomUser.current.last_name}`
                        : 'No one'
                    }
                  </Typography>
                  <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: isSmallScreen ? '20px' : '40px', textAlign: 'center' }}>
                    {
                      randomUser.current
                        ? `Ticket Number: ${getReadableTicketNumber(randomUser.current.scanned_in)}`
                        : ''
                    }
                  </Typography>
                </Box>
              </>
            </Modal>
          </>
        </Modal>
      </Toolbar>
    </Table>
  );
};

ScannedInTable.propTypes = {
  loading: PropTypes.bool,
  scannedInUsers: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]).isRequired,
  updateUser: PropTypes.func.isRequired,
  usersEvent: PropTypes.object.isRequired,
};

ScannedInTable.defaultProps = {
  loading: false
};

function isSameTable(prevProps, nextProps) {
  const isSame = isEqual(prevProps.scannedInUsers, nextProps.scannedInUsers);
  return isSame;
};

export default memo(ScannedInTable, isSameTable);
