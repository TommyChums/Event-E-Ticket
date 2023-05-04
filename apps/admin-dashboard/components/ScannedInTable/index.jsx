import { useEffect, useState, useMemo, memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSnackbar } from 'notistack';
import moment from 'moment';
import escapeRegExp from 'lodash/escapeRegExp';
import every from 'lodash/every';
import filter from 'lodash/filter';
import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import useMediaQuery from '@mui/material/useMediaQuery';
import Autocomplete from '@mui/material/Autocomplete';
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import Table from '../Table';
import QrCodeScanner from '../QrCodeScanner';
import RandomWheel from '../RandomWheel';
import getReadableTicketNumber from '../../lib/helpers/getReadableTicketNumber';

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
    id: 'ticket_number',
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
  const supabase = useSupabaseClient();

  const { enqueueSnackbar } = useSnackbar();

  const [ userToEnter, setUserToEnter ] = useState(null);
  const [ shouldScan, setShouldScan ] = useState();
  const [ usersList, setUsersList ] = useState([]);

  useEffect(() => {
    setShouldScan(!isEmpty(props.usersEvent.ticket_template))
  }, [ props.usersEvent ]);

  useEffect(() => {
    setUsersList(
      map(props.users, ({ first_name, last_name, email, registration_number, scanned_in }) => (
        {
          label: `${first_name} ${last_name} - ${email} | ${registration_number}`,
          id: registration_number,
          scanned_in
        }
      ))
    );
  }, [ props.users ]);

  const [ open, setOpen ] = useState(false);
  const dataRead = useRef(false);

  const handleClose = () => {
    setOpen(false);
    setUserToEnter(null);
    setTimeout(() => {
      dataRead.current = false;
    }, 500);
  };

  const handleRead = async (qrcodeInfo) => {
    if (!dataRead.current) {
      dataRead.current = true;
      console.log(qrcodeInfo, dataRead.current)
      const regNumberTicketNumber = qrcodeInfo || '';

      const [ regNumber ] = regNumberTicketNumber.split('-');

      let invalid = true;

      if (regNumber) {
        const { data: ticketUser } = await supabase.from('registered-users')
          .select('scanned_in')
          .eq('registration_number', regNumber)
          .eq('registered_event', props.usersEvent.uuid)
          .single();

        if (ticketUser?.scanned_in) {
          invalid = false;
          enqueueSnackbar(
            shouldScan ? 'This ticket was already scanned in'
            : 'This person has already been entered'
            , {
            variant: 'error'
          });
        } else if (ticketUser) {
          invalid = false;

          const { data: updatedTicketUser, error } = await supabase.from('registered-users').update({
            scanned_in: true,
            updated_on: moment().toISOString()
          }).eq('registration_number', regNumber).select().single();

          if (error || !updatedTicketUser) {
            enqueueSnackbar(
              shouldScan ? 'Error confirming this ticket. Please try again'
              : 'Error entering this person. Please try again'
              , {
              variant: 'error'
            });
          } else {
            enqueueSnackbar(
              shouldScan? 'Valid Ticket'
              : 'Person Entered'
              , {
              variant: 'success'
            });

            props.updateUser(updatedTicketUser);
            if (shouldScan)
              setOpen(false);
            dataRead.current = false;
          };
        };
      };

      if (invalid) {
        enqueueSnackbar(
          shouldScan ? 'Invalid Ticket'
          : 'An error occured'
          , {
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
              {shouldScan ? <QrCodeScannerIcon /> : <PersonAddIcon />}
            </IconButton>
          }
          label={shouldScan ? "Scan Ticket" : "Enter Person"}
          labelPlacement="start"
          onClick={() => setOpen(true)}
          sx={{ width: '175px', marginRight: '1rem' }}
        />
      </Stack>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {shouldScan ? "Scan Ticket" : "Enter Person"}
            <IconButton onClick={handleClose}>
              <HighlightOffIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        {
          shouldScan ? (
            <QrCodeScanner
              onScan={handleRead}
            />
          ) : (
            <>
              <Autocomplete
                options={usersList}
                sx={{ padding: 1, width: 280 }}
                autoHighlight
                getOptionDisabled={(option) =>
                  option.scanned_in
                }
                onChange={(_, newValue) => {
                  setUserToEnter(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Person" variant="standard" />
                )}
              />
              <Button
                onClick={() => handleRead(userToEnter?.id?.toString())}
                sx={{ width: 280, marginTop: '10px', padding: 1, alignSelf: 'center' }}
                variant="contained"
              >
                Enter
              </Button>
            </>
          )
        }
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

function ScannedInTable({ loading, scannedInUsers, updateUser, users, usersEvent }) {
  const isSmallScreen = useMediaQuery('(max-width:780px)');

  const [ open, setOpen ] = useState(false);
  const [ winnerOpen, setWinnerOpen ] = useState(false);
  const [ rows, setRows ] = useState([]);
  const [ searchValue, setSearchValue ] = useState('');

  const [ segsToUse, setSegsToUse ] = useState([]);

  const randomUser = useRef(null);

  const ticketNumbers = useMemo(() => (
    every(scannedInUsers, ({ ticket_number }) => !!ticket_number)
  ), [ scannedInUsers ]);

  
  useEffect(() => {
    if (isEmpty(scannedInUsers))
      return;

    const arr = [];
    const segs = ticketNumbers
      ? map(scannedInUsers, (user) => getReadableTicketNumber(user.ticket_number))
      : map(scannedInUsers, (user) => user.registration_number);
  
    const totalSegs = 20;
    let totalSegsIndex = 0;
    let currentSegsIndex = 0;
    do {
      arr[totalSegsIndex] = arr[totalSegsIndex]
        ? arr[totalSegsIndex] + `,${segs[currentSegsIndex]}`
        : segs[currentSegsIndex].toString();
  
      currentSegsIndex += 1;
      totalSegsIndex += 1;

      if (totalSegsIndex >= totalSegs) totalSegsIndex = 0;
    } while (currentSegsIndex < segs.length);

    setSegsToUse(arr);
  }, [ scannedInUsers, ticketNumbers ]);

  useEffect(() => {
    const searchedUsers = filter(scannedInUsers, ({
      first_name, last_name, registration_number, ticket_number
    }) => {
      const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

      return (
        searchRegex.test(first_name) ||
        searchRegex.test(last_name) ||
        searchRegex.test(`${first_name} ${last_name}`) ||
        searchRegex.test(registration_number) ||
        searchRegex.test(ticket_number)
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
          users={users}
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
                  if (winningTicket) {
                    const winningTicketNumbers = winningTicket.split(',');
                    const randomIndex = Math.floor(Math.random() * winningTicketNumbers.length);
  
                    const winningNum = winningTicketNumbers[randomIndex];
  
                    if (ticketNumbers) {
                      randomUser.current = find(scannedInUsers, [ 'ticket_number', +winningNum ]);
                    } else {
                      randomUser.current = find(scannedInUsers, [ 'registration_number', +winningNum ]);
                    }
                  }

                  setWinnerOpen(true);
                }}
                segments={segsToUse}
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
                  <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: isSmallScreen ? '20px' : '30px', textAlign: 'center' }}>
                    {
                      randomUser.current?.ticket_number
                        ? ''
                        : randomUser.current ? `Email: ${getReadableTicketNumber(randomUser.current.email.toLowerCase())}` : ''
                    }
                  </Typography>
                  <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: isSmallScreen ? '20px' : '30px', textAlign: 'center' }}>
                    {
                      randomUser.current?.ticket_number
                        ? `Ticket Number: ${getReadableTicketNumber(randomUser.current.ticket_number)}`
                        : randomUser.current ? `Registration Number: ${randomUser.current.registration_number}` : ''
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
  users: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]).isRequired,
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
