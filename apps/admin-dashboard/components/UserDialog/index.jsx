import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import isFinite from 'lodash/isFinite';
import toNumber from 'lodash/toNumber';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
// import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

import Can from '../Can';
import { makeAuthenticatedPostRequest } from '../../lib/api/makeAuthenticatedRequest';
import getUserAmtPaidAndRequired from '../../lib/helpers/getUserAmtPaidAndRequired';
import useDispatch from '../../lib/hooks/useDispatch';
import { deleteEventUser } from '../../lib/state/actions/eventUsers';
import CONSTANTS from '../../lib/state/constants';
import useCan from '../../lib/hooks/useCan';

const {
  RBAC: {
    ACTIONS,
    SUBJECTS,
  },
} = CONSTANTS;

export default function UserDialog({ event, open, onClose, user, updatePayment, updateUser, ...props }) {
  const { can, cannot } = useCan();
  const supabase = useSupabaseClient();

  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const [ amountPaid, setAmountPaid ] = useState(0);
  const [ currentPayment, setCurentPayment ] = useState(0);
  const [ amountRequriedToPay, setAmountRequiredToPay ] = useState(0);
  const [ updating, setUpdating ] = useState(false);
  const [ issuingTicket, setIssuingTicket ] = useState(false);

  const eTicketsEnabled = !isEmpty(event.ticket_template)
  const canBeDeleted = can(ACTIONS.MANAGE, SUBJECTS.USERS) && isEmpty(user.payments) && !user.ticket_issued;

  useEffect(() => {
    if (isEmpty(user) || isEmpty(event)) {
      onClose();
    }

    const paymentConfig = event.payment_config;

    if (paymentConfig) {
      const { userAmountPaid, userAmountRequired } = getUserAmtPaidAndRequired(paymentConfig, user);

      setAmountRequiredToPay(userAmountRequired);
      setAmountPaid(userAmountPaid);
    } else {
      setAmountRequiredToPay(0);
      setAmountPaid(0);
    }
  }, [ event, user, onClose ]);

  const handleDeleteUser = async () => {
    try {
      await confirm({
        title: 'Are you sure you wish to delete this user?',
        description: 'The user will not be notified that this was done. This action is irreversible',
        confirmationText: 'Delete',
        cancellationText: 'Cancel',
        allowClose: false,
        confirmationButtonProps: {
          variant: 'contained',
          color: 'error'
        },
        cancellationButtonProps: {
          variant: 'outlined'
        }
      });

      enqueueSnackbar(`Deleting ${user.first_name} ${user.last_name}`, {
        variant: 'info'
      });

      const { error } = await supabase.from('registered-users').delete().eq('uuid', user.uuid);

      if (error) {
        enqueueSnackbar(`Failed to delete ${user.first_name} ${user.last_name}: ${error.message}`, {
          variant: 'error'
        });
      } else {
        enqueueSnackbar(`Deleted ${user.first_name} ${user.last_name}`, {
          variant: 'success'
        });

        dispatch(deleteEventUser({ eventUuid: event.uuid, uuid: user.uuid }));
      }
    } catch (e) {
      console.log('Delete cancelled');
    }
  };

  const updateCurrentPayment = ({ target: { value } }) => {
    const numberVal = toNumber(value);
    if (isFinite(numberVal) && numberVal > -1 && numberVal <= amountRequriedToPay) {
      setCurentPayment(numberVal);
    }
  };

  const handleIssueTicket = async () => {
    setIssuingTicket(true);
    let issuingId = null;
    try {
      let userTicketNum = '';

      // if (!eTicketsEnabled) {
      //   await confirm({
      //     title: 'Enter Ticket Number',
      //     content: (
      //       <TextField
      //         fullWidth
      //         helperText="Please enter a number only"
      //         onChange={({ target }) => {
      //           const { value } = target;
      //           userTicketNum = +value
      //         }}
      //         inputProps={{
      //           inputMode: 'numeric',
      //           pattern: '[0-9]*'
      //         }}
      //       />
      //     ),
      //     confirmationText: 'Update',
      //     cancellationText: 'Cancel',
      //     allowClose: false,
      //     confirmationButtonProps: {
      //       variant: 'contained',
      //     },
      //     cancellationButtonProps: {
      //       variant: 'outlined'
      //     }
      //   });

      //   if (userTicketNum !== '' && !isFinite(userTicketNum)) {
      //     enqueueSnackbar('Invalid ticket number. Leave Empty to Auto Generate', {
      //       variant: 'error',
      //       persist: true,
      //       action: (id) => {
      //         issuingId = id;
      //       }
      //     });

      //     throw new Error('Invalid Ticket Number');
      //   }
      // }

      if (eTicketsEnabled) {
        enqueueSnackbar(`Issuing ticket to ${user.email}`, {
          variant: 'info',
          persist: true,
          action: (id) => {
            issuingId = id;
          }
        });
      } else {
        enqueueSnackbar(`Updating ${user.email}`, {
          variant: 'info',
          persist: true,
          action: (id) => {
            issuingId = id;
          }
        });
      }

      const {
        data: {
          user: issuedUser
        },
        error: issueError
      } = await makeAuthenticatedPostRequest('/api/issue-ticket', { user_uuid: user.uuid, ticket_num: userTicketNum });

      closeSnackbar(issuingId);

      if (issueError) {
        if (eTicketsEnabled) {
          enqueueSnackbar(`Error isuing ticket to ${user.email}: ${issueError}`, {
            variant: 'error'
          });
        } else {
          enqueueSnackbar(`Error updating ${user.email}: ${issueError}`, {
            variant: 'error'
          });
        }
      } else {
        if (eTicketsEnabled) {
          enqueueSnackbar(`Ticket successfully issued to ${user.email}!`, {
            variant: 'success'
          });
        } else {
          enqueueSnackbar(`${user.email} has been updated!`, {
            variant: 'success'
          });
        }

        updateUser(issuedUser);
      }
    } catch (e) {
      console.log('Issuing ticket cancelled');
    }

    setIssuingTicket(false);
  };

  const handlePaymentUpdate = async () => {
    setUpdating(true);

    let success = true;

    if (amountRequriedToPay > 0) {
      const paymentTime = moment().toISOString();

      enqueueSnackbar('Storing Payment', {
        variant: 'info'
      });

      const { data: payment, error: insertError } = await supabase.from('registered-user-payments').insert({
        user_uuid: user.uuid,
        amount: currentPayment,
        timestamp: paymentTime
      }).select().single();

      enqueueSnackbar('Updating User', {
        variant: 'info'
      });

      const { data: updatedUser, error: updateError } = await supabase.from('registered-users').update({
        updated_on: paymentTime
      }).eq('uuid', user.uuid).select().single();

      success = !updateError && !insertError;

      if (!success) {
        enqueueSnackbar(insertError.message || updateError.message, {
          variant: 'error'
        });
      } else {
        updateUser(updatedUser);
        updatePayment(payment);
      }

      enqueueSnackbar('Payment stored and User Updated', {
        variant: 'success'
      });
    } else if (amountRequriedToPay - currentPayment === 0) {
      await handleIssueTicket();
    }

    setUpdating(false);
    setCurentPayment(0);
  };

  return (
    <Dialog {...props} onClose={onClose} open={open}>
      {
        user.ticket_issued && (
          <Alert severity="success" sx={{ display: 'flex', flexDirection: 'row', placeItems: 'center', gap: '5px' }}>
            <p style={{ margin: '0', padding: '0' }}>
              {eTicketsEnabled ? "Ticket Successfully Issued" : "User Successfully Updated"}
            </p>
            {
              eTicketsEnabled ?
                <a
                  href={`/api/ticket/${user.registered_event}/${user.ticket_number.toString().padStart(4, '0')}`}
                  rel="noreferrer"
                  style={{
                    color: '#651fff'
                  }}
                  target='_blank'
                >
                  View Ticket
                </a>
              : null
            }
          </Alert>
        )
      }
      <DialogTitle style={{ padding: '16px 12px 0px' }}>{user.first_name} {user.last_name}</DialogTitle>
      <DialogContent style={{ padding: '20px 12px' }}>
        <Stack direction="column" spacing={2} width="100%">
          <Typography>
            Amount Required: ${amountRequriedToPay}
          </Typography>
          <Typography>
            Amount Paid: ${amountPaid}
          </Typography>
          <Can I={ACTIONS.CREATE} A={SUBJECTS.PAYMENTS}>
            <div style={{ width: '100%' }}>
              <InputLabel htmlFor="outlined-adornment-amount">Current payment</InputLabel>
              <OutlinedInput
                fullWidth
                id="outlined-adornment-amount"
                label="Amount"
                onChange={updateCurrentPayment}
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                value={currentPayment}
              />
            </div>
          </Can>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: '12px' }}>
        <Stack spacing={1} width="100%">
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Can I={ACTIONS.CREATE} A={SUBJECTS.PAYMENTS}>
              <Button
                disabled={
                  updating ||
                  issuingTicket ||
                  currentPayment <= 0 &&
                  amountRequriedToPay > 0 ||
                  amountRequriedToPay <= 0
                }
                onClick={handlePaymentUpdate}
                sx={{ width: '9rem' }}
                variant="contained"
              >
                {updating ? 'Adding ' : 'Add Payment'}
              </Button>
            </Can>
            <Button onClick={onClose} variant="outlined" fullWidth={cannot(ACTIONS.CREATE, SUBJECTS.PAYMENTS)}>Cancel</Button>
          </Stack>
          <Can I={ACTIONS.ISSUE} A={SUBJECTS.TICKETS}>
            <Button
              disabled={user.ticket_issued || updating || issuingTicket}
              onClick={handleIssueTicket}
              sx={{ width: '100%' }}
              variant="contained"
            >
              {issuingTicket ? (eTicketsEnabled ? 'Issuing Ticket' : 'Updating User') : (eTicketsEnabled ? 'Issue Ticket' : 'Ticket Issued')}
            </Button>
          </Can>
          {
            canBeDeleted &&
              <Button
                color="error"
                disabled={issuingTicket}
                onClick={handleDeleteUser}
                sx={{ width: '100%' }}
                variant="contained"
              >
                Delete
              </Button>

          }
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

UserDialog.propTypes = {
  event: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  updatePayment: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired
};
