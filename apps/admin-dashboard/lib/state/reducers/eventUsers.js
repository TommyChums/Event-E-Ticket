import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import keyBy from 'lodash/keyBy';

import C from '../constants.js';

export const initialState = {
  users: {},
  loading: false,
  error: null
};

const eventUsersReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
  case C.EVENT_USERS_RECEIVED_USERS: {
    return {
      ...state,
      users: {
        ...state.users,
        [payload.eventUuid]: keyBy(payload.users, 'uuid')
      },
      loading: false
    };
  }
  case C.EVENT_USERS_UPDATE_USER:
  case C.EVENT_USERS_INSERT_USER: {
    const userEventUuid = payload.eventUuid;
    const user = payload.user;

    const existingUser = get(state.users[userEventUuid], user.uuid, {});

    return {
      ...state,
      users: {
        ...state.users,
        [userEventUuid]: {
          ...state.users[userEventUuid],
          [user.uuid]: {
            ...existingUser,
            ...user
          }
        }
      }
    };
  }
  case C.EVENT_USERS_PAYMENT_UPDATE:
  case C.EVENT_USERS_PAYMENT_INSERT: {
    const userEventUuid = payload.eventUuid;
    const paymentUserUuid = payload.payment.user_uuid;

    if (!state.users[userEventUuid][paymentUserUuid]) {
      return state;
    }

    const payments = keyBy(state.users[userEventUuid][paymentUserUuid].payments, 'uuid');

    payments[payload.payment.uuid] = payload.payment;

    return {
      ...state,
      users: {
        ...state.users,
        [userEventUuid]: {
          ...state.users[userEventUuid],
          [paymentUserUuid]: {
            ...state.users[userEventUuid][paymentUserUuid],
            payments: Object.values(payments)
          }
        }
      }
    };
  }
  case C.EVENT_USERS_DELETE_USER: {
    const updatedEventUsers = {
      ...state.users[payload.eventUuid]
    };

    delete updatedEventUsers[payload.uuid];

    return {
      ...state,
      users: {
        ...state.users,
        [payload.eventUuid]: updatedEventUsers
      }
    };
  }
  case C.EVENT_USERS_ERROR: {
    return {
      ...state,
      error: payload
    };
  }
  case C.EVENT_USERS_LOADING: {
    return {
      ...state,
      loading: isEmpty(state.users[payload.eventUuid]) ? payload.loading : false
    };
  }
  default: {
    return state || initialState;
  }
  };
};

export default eventUsersReducer;
