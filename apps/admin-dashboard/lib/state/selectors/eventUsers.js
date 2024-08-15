import { useEffect, useRef } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import filter from 'lodash/filter';
import forEach from 'lodash/forEach';
import get from 'lodash/get';
import map from 'lodash/map';

import useEventsContext from '../../hooks/useEventsContext';
import { eventUsersError, eventUsersLoading, receivedEventUsers } from '../actions/eventUsers';

export function useScannedInUsers(eventUuid) {
  const { eventUsers = {} } = useEventsContext();

  const allEventUsers = get(eventUsers.users, eventUuid, {});

  return {
    scannedInUsers: filter(allEventUsers, ({ scanned_in }) => scanned_in),
    loading: eventUsers.loading
  };
};

export function useEventPayments(eventUuid) {
  const { eventUsers = {} } = useEventsContext();

  let allPayments = [];

  const allEventUsers = get(eventUsers.users, eventUuid, {});

  forEach(allEventUsers, (eventUser) => {
    const formattedPayments = map(eventUser.payments, (payment) => ({
      ...payment,
      first_name: eventUser.first_name,
      last_name: eventUser.last_name,
      email: eventUser.email
    }));

    allPayments = allPayments.concat(formattedPayments);
  });

  return {
    payments: allPayments,
    loading: eventUsers.loading
  };
};

export function useEventUsers(eventUuid) {
  const supabase = useSupabaseClient();
  const pollRef = useRef(null);

  const authenticatedUser = useUser();

  const { eventUsers = {}, dispatch } = useEventsContext();

  useEffect(() => {
    if (!authenticatedUser || !eventUuid) {
      return;
    }

    async function getUsersWithPayments() {
      dispatch(eventUsersLoading({ eventUuid, loading: true }));
      const { data: users, error } = await supabase.from('registered-users')
        .select('*, payments:registered-user-payments(*), collapseContent:registered-user-duplicates(*)')
        .eq('registered_event', eventUuid);

      if (error) {
        dispatch(eventUsersError(error));
      }

      dispatch(receivedEventUsers({ eventUuid, users }));
      dispatch(eventUsersLoading({ eventUuid, loading: false }));
    };

    getUsersWithPayments();

    if (!pollRef.current) {
      pollRef.current = setInterval(() => {
        getUsersWithPayments();
      }, 10 * 1000);
    }

    return () => {
      clearInterval(pollRef.current);
    };
  }, [ authenticatedUser, eventUuid, dispatch ]);

  return {
    eventUsers: get(eventUsers.users, eventUuid, {}),
    loading: eventUsers.loading
  };
};

export function useEventUser(eventUuid, userUuid) {
  const { eventUsers = {} } = useEventsContext();

  return {
    eventUser: get(eventUsers.users, `${eventUuid}.${userUuid}`, {}),
    loading: eventUsers.loading
  };
};

export function useEvents() {
  const { events = {} } = useEventsContext();

  return events;
};
