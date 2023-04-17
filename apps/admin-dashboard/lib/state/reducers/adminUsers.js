import isEmpty from 'lodash/isEmpty';
import keyBy from 'lodash/keyBy';

import C from '../constants';

export const initialState = {
  users: {},
  loading: false,
  error: null
};

const adminUsersReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
  case C.ADMIN_USERS_RECEIVED_USERS: {
    return {
      ...state,
      users: keyBy(payload, 'id'),
      loading: false,
      error: null
    };
  }
  case C.ADMIN_USERS_UPDATE_USER:
  case C.ADMIN_USERS_INSERT_USER: {
    return {
      ...state,
      users: {
        ...state.users,
        [payload.id]: payload
      },
    };
  }
  case C.ADMIN_USERS_DELETE_USER: {
    const newUsers = { ...state.users };

    delete newUsers[payload.id];

    return {
      ...state,
      users: newUsers
    };
  }
  case C.ADMIN_USERS_ERROR: {
    return {
      ...state,
      error: payload,
      loading: false
    };
  }
  case C.ADMIN_USERS_LOADING: {
    return {
      ...state,
      loading: isEmpty(state.users) ? payload : false
    };
  }
  default: {
    return state || initialState;
  }
  };
};

export default adminUsersReducer;
