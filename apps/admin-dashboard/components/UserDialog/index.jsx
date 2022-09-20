import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
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

export default function UserDialog({ event, open, onClose, user, updatePayment, updateUser, ...props}) {
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();

  const [ amountPaid, setAmountPaid ] = useState(0);
  const [ currentPayment, setCurentPayment ] = useState(0);
  const [ amountRequriedToPay, setAmountRequiredToPay ] = useState(0);
  const [ updating, setUpdating ] = useState(false);

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

  const updateCurrentPayment = ({ target: { value } }) => {
    const numberVal = toNumber(value);
    if (isFinite(numberVal) && numberVal > -1 && numberVal <= amountRequriedToPay) {
      setCurentPayment(numberVal);
    }
  };

  const handlePaymentUpdate = async () => {
    setUpdating(true);

    let success = true;

    let issuingId = null;

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
    }

    if (success && ((amountRequriedToPay - currentPayment) === 0)) {
      enqueueSnackbar(`Issuing ticket to ${user.email}`, {
        variant: 'info',
        persist: true,
        action: (id) => { issuingId = id },
      });

      const { data: { user: issuedUser }, error: issueError } = await makeAuthenticatedPostRequest('/api/issue-ticket', { user_uuid: user.uuid });

      closeSnackbar(issuingId);

      if (issueError) {
        enqueueSnackbar(`Error isuing ticket to ${user.email}: ${issueError.message}`, {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(`Ticket successfully issued to ${user.email}!`, {
          variant: 'success',
        });

        updateUser(issuedUser);
      }
    } else if (success) {
      enqueueSnackbar('Payment stored and User Updated', {
        variant: 'success',
      });
    }

    setUpdating(false);
    setCurentPayment(0);
  };

  return (
    <Dialog {...props} open={open} onClose={onClose}>
      { user.ticket_issued && <Alert severity="success">Ticket Successfully Issued</Alert> }
      <DialogTitle>{user.first_name} {user.last_name}</DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={2}>
          <Typography>
            Amount Required: ${amountRequriedToPay}
          </Typography>
          <Typography>
            Amount Paid: ${amountPaid}
          </Typography>
          <div>
            <InputLabel htmlFor="outlined-adornment-amount">Current payment</InputLabel>
            <OutlinedInput
              id="outlined-adornment-amount"
              value={currentPayment}
              onChange={updateCurrentPayment}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              label="Amount"
            />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          disabled={
            user.ticket_issued ||
            updating ||
            (currentPayment <= 0 &&
            amountRequriedToPay > 0) ||
            (amountRequriedToPay <= 0 &&
            user.ticket_issued)
          } 
          onClick={handlePaymentUpdate}
        >
          {updating ? 'Updating' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
