import get from 'lodash/get';

import useEventsContext from '../../hooks/useEventsContext';

export function useAdminUser(userUuid) {
  const { adminUsers = {} } = useEventsContext();

  return {
    user: get(adminUsers.users, userUuid, {}),
    loading: adminUsers.loading
  };
};

export function useAdminUsers() {
  const { adminUsers = {} } = useEventsContext();

  return {
    users: adminUsers.users,
    loading: adminUsers.loading,
    error: adminUsers.error,
  };
};
