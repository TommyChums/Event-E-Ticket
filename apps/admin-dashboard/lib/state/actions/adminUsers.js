import C from '../constants';

export const adminUsersLoadingAction = (payload) => ({
  type: C.ADMIN_USERS_LOADING,
  payload
});

export const adminUsersErrorAction = (payload) => ({
  type: C.ADMIN_USERS_ERROR,
  payload
});

export const receivedAdminUsersAction = (payload) => ({
  type: C.ADMIN_USERS_RECEIVED_USERS,
  payload
});

export const createAdminUser = (payload) => ({
  type: C.ADMIN_USERS_INSERT_USER,
  payload
});

export const updateAdminUser = (payload) => ({
  type: C.ADMIN_USERS_UPDATE_USER,
  payload
});

export const deleteAdminUser = (payload) => ({
  type: C.ADMIN_USERS_DELETE_USER,
  payload
});
