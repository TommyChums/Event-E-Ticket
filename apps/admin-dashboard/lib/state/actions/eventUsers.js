import C from '../constants';

export const eventUsersLoading = (payload) => ({
  type: C.EVENT_USERS_LOADING,
  payload
});

export const eventUsersError = (payload) => ({
  type: C.EVENT_USERS_ERROR,
  payload
});

export const receivedEventUsers = (payload) => ({
  type: C.EVENT_USERS_RECEIVED_USERS,
  payload
});

export const updateEventUser = (payload) => ({
  type: C.EVENT_USERS_UPDATE_USER,
  payload
});

export const deleteEventUser = (payload) => ({
  type: C.EVENT_USERS_DELETE_USER,
  payload
});

export const paymentUpdate = (payload) => ({
  type: C.EVENT_USERS_PAYMENT_UPDATE,
  payload
});
