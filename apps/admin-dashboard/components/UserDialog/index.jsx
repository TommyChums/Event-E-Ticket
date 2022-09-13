import { useEffect, useState } from 'react';
import moment from 'moment';
import findKey from 'lodash/findKey';
import reduce from 'lodash/reduce';
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

export default function UserDialog({ event, open, onClose, user, ...props}) {
  const [ saveStatus, setSaveStatus ] = useState(null);
  const [ amountPaid, setAmountPaid ] = useState(0);
  const [ currentPayment, setCurentPayment ] = useState(0);
  const [ amountRequriedToPay, setAmountRequiredToPay ] = useState(0);
  const [ updating, setUpdating ] = useState(false);

  useEffect(() => {
    setUpdating(false);
    setCurentPayment(0);

    if (user.ticket_issued) {
      setSaveStatus({ type: 'success', message: 'Ticket successfully issued!' });
    }

    console.log(user, event)
    const paymentConfig = event.payment_config;

    if (paymentConfig) {
      const earlyBirdDate = paymentConfig.early_bird_date;
    
      let earlyBirdPayments = false;
    
      const userAmountPaid = reduce(user.payments, (total, payment) => {
        total += payment.amount;
        if (earlyBirdDate) {
          earlyBirdPayments = moment(payment.timestamp).isSameOrBefore(earlyBirdDate);
        }
        return total;
      }, 0);
    
      const isEarlyBirdActive = !!earlyBirdDate && (earlyBirdPayments || moment().isSameOrBefore(earlyBirdDate));
    
      const userAgeMapping = findKey(paymentConfig.age_mapping, (ages) => {
        const [ ageFrom, ageTo ] = ages;
        return (user.age >= ageFrom && user.age <= ageTo)
      });
    
      const userAmountRequired = isEarlyBirdActive
        ? paymentConfig.early_bird_price_by_age[userAgeMapping]
        : paymentConfig.price_by_age[userAgeMapping];

      setAmountRequiredToPay(userAmountRequired - userAmountPaid);
      setAmountPaid(userAmountPaid);
    } else {
      setAmountRequiredToPay(0);
      setAmountPaid(0);
    }
    
  }, [ event, user ]);

  const updateCurrentPayment = ({ target: { value } }) => {
    const numberVal = toNumber(value);
    if (isFinite(numberVal) && numberVal > -1 && numberVal <= amountRequriedToPay) {
      setCurentPayment(numberVal);
    }
  };

  const handlePaymentUpdate = async () => {
    setSaveStatus(null);
    setUpdating(true);

    let success = true;

    if (amountRequriedToPay > 0) {
      const paymentTime = moment().toISOString();

      setSaveStatus({ type: 'info', message: 'Storing Payment' });
      const { error: insertError } = await supabase.from('registered-user-payments').insert({
        user_uuid: user.uuid,
        amount: currentPayment,
        timestamp: paymentTime,
      });

      setSaveStatus({ type: 'info', message: 'Updating User' });
      const { error: updateError } = await supabase.from('registered-users').update({
        updated_on: paymentTime,
      }).eq('uuid', user.uuid);

      success = !updateError && !insertError;

      if (!success) {
        setSaveStatus({ type: 'error', message: insertError.message || updateError.message });
      }
    }

    if (success && ((amountRequriedToPay - currentPayment) === 0)) {
      setSaveStatus({ type: 'info', message: 'Issuing ticket...' });
      const { error: issueError } = await makeAuthenticatedPostRequest('/api/issue-ticket', { user_uuid: user.uuid });

      if (issueError) {
        setSaveStatus({ type: 'error', message: issueError.message });
      } else {
        setSaveStatus({ type: 'success', message: 'Ticket successfully issued!' });
      }
    } else if (success) {
      setSaveStatus({ type: 'success', message: 'Payment stored and User Updated' });
    }

    setUpdating(false);
  };

  return (
    <Dialog {...props} open={open} onClose={onClose}>
      { saveStatus && <Alert severity={saveStatus.type}>{saveStatus.message}</Alert> }
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
            (currentPayment <= 0 &&
            amountRequriedToPay > 0) ||
            amountRequriedToPay <= 0
          } 
          onClick={handlePaymentUpdate}
        >
          {updating ? 'Updating' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
