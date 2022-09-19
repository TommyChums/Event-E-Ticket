import findKey from 'lodash/findKey';
import reduce from 'lodash/reduce';
import moment from 'moment';

export default function getUserAmtPaidAndRequired(paymentConfig, user) {
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
    const { from: ageFrom, to: ageTo } = ages;
    return (user.age >= ageFrom && user.age <= ageTo)
  });

  const totalRequired = isEarlyBirdActive
    ? paymentConfig.early_bird_price_by_age[userAgeMapping]
    : paymentConfig.price_by_age[userAgeMapping];

  return {
    userAmountPaid,
    userAmountRequired: totalRequired - userAmountPaid,
  };
};
