import { useEffect, useState } from 'react';
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
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

import supabase from '../../lib/supabase';
import { makeAuthenticatedPostRequest } from '../../lib/api/makeAuthenticatedRequest';
import getUserAmtPaidAndRequired from '../../lib/helpers/getUserAmtPaidAndRequired';
import useDispatch from '../../lib/hooks/useDispatch';
import { deleteEventUser } from '../../lib/state/actions/eventUsers';

export default function UserDialog({ event, open, onClose, user, updatePayment, updateUser, ...props}) {
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const [ amountPaid, setAmountPaid ] = useState(0);
  const [ currentPayment, setCurentPayment ] = useState(0);
  const [ amountRequriedToPay, setAmountRequiredToPay ] = useState(0);
  const [ updating, setUpdating ] = useState(false);
  const [ issuingTicket, setIssuingTicket ] = useState(false);

  const canBeDeleted = isEmpty(user.payments) && !user.ticket_issued;

  useEffect(() => {
    if (isEmpty(user) || isEmpty(event)) onClose();

    const paymentConfig = event.payment_config;

    if (paymentConfig) {
      const { userAmountPaid, userAmountRequired } = getUserAmtPaidAndRequired(paymentConfig, user)

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
          color: 'error',
        },
        cancellationButtonProps: {
          variant: 'outlined',
        },
      });

      enqueueSnackbar(`Deleting ${user.first_name} ${user.last_name}`, {
        variant: 'info',
      });

      const { error } = await supabase.from('registered-users').delete().eq('uuid', user.uuid);

      if (error) {
        enqueueSnackbar(`Failed to delete ${user.first_name} ${user.last_name}: ${error.message}`, {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(`Deleted ${user.first_name} ${user.last_name}`, {
          variant: 'success',
        });

        dispatch(deleteEventUser({ eventUuid: event.uuid, uuid: user.uuid }));
      }
    } catch (e) {
      console.log('Delete cancelled')
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

    enqueueSnackbar(`Issuing ticket to ${user.email}`, {
      variant: 'info',
      persist: true,
      action: (id) => { issuingId = id },
    });

    const { data: { user: issuedUser }, error: issueError } = await makeAuthenticatedPostRequest('/api/issue-ticket', { user_uuid: user.uuid });

    closeSnackbar(issuingId);

    if (issueError) {
      enqueueSnackbar(`Error isuing ticket to ${user.email}: ${issueError}`, {
        variant: 'error',
      });
    } else {
      enqueueSnackbar(`Ticket successfully issued to ${user.email}!`, {
        variant: 'success',
      });

      updateUser(issuedUser);
    }

    setIssuingTicket(false);
  };

  const handlePaymentUpdate = async () => {
    setUpdating(true);

    let success = true;

    if (amountRequriedToPay > 0) {
      const paymentTime = moment().toISOString();

      enqueueSnackbar('Storing Payment', {
        variant: 'info',
      });

      const { data: payment, error: insertError } = await supabase.from('registered-user-payments').insert({
        user_uuid: user.uuid,
        amount: currentPayment,
        timestamp: paymentTime,
      }).single();

      enqueueSnackbar('Updating User', {
        variant: 'info',
      });

      const { data: updatedUser, error: updateError } = await supabase.from('registered-users').update({
        updated_on: paymentTime,
      }).eq('uuid', user.uuid).single();

      success = !updateError && !insertError;

      if (!success) {
        enqueueSnackbar(insertError.message || updateError.message, {
          variant: 'error',
        });
      } else {
        updateUser(updatedUser);
        updatePayment(payment);
      }

      enqueueSnackbar('Payment stored and User Updated', {
        variant: 'success',
      });
    } else if ((amountRequriedToPay - currentPayment) === 0) {
      await handleIssueTicket();
    }

    setUpdating(false);
    setCurentPayment(0);
  };

  return (
    <Dialog {...props} open={open} onClose={onClose}>
      { user.ticket_issued && <Alert severity="success">Ticket Successfully Issued</Alert> }
      <DialogTitle style={{ padding: "16px 12px 0px" }}>{user.first_name} {user.last_name}</DialogTitle>
      <DialogContent style={{ padding: '20px 12px' }}>
        <Stack direction="column" spacing={2} width="100%">
          <Typography>
            Amount Required: ${amountRequriedToPay}
          </Typography>
          <Typography>
            Amount Paid: ${amountPaid}
          </Typography>
          <div style={{ width: '100%' }}>
            <InputLabel htmlFor="outlined-adornment-amount">Current payment</InputLabel>
            <OutlinedInput
              fullWidth
              id="outlined-adornment-amount"
              value={currentPayment}
              onChange={updateCurrentPayment}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              label="Amount"
            />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: '12px' }}>
        <Stack spacing={1} width="100%">
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button
              sx={{ width: '9rem' }}
              variant="contained"
              disabled={
                user.ticket_issued ||
                updating ||
                issuingTicket ||
                (currentPayment <= 0 &&
                amountRequriedToPay > 0) ||
                amountRequriedToPay <= 0
              } 
              onClick={handlePaymentUpdate}
            >
              {updating ? 'Adding ' : 'Add Payment'}
            </Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
          </Stack>
          <Button
            sx={{ width: '100%' }}
            variant="contained"
            disabled={user.ticket_issued || updating || issuingTicket} 
            onClick={handleIssueTicket}
          >
            {issuingTicket ? 'Issuing Ticket' : 'Issue Ticket'}
          </Button>
          {
            canBeDeleted && (
              <Button
                sx={{ width: '100%' }}
                disabled={issuingTicket}
                variant="contained"
                color="error"
                onClick={handleDeleteUser}
              >
                Delete
              </Button>
            )
          }
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
