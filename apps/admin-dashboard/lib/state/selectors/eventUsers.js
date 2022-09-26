import { useEffect, useRef } from "react";
import get from 'lodash/get';

import useEventsContext from "../../hooks/useEventsContext";
import supabase from "../../supabase";
import { eventUsersError, eventUsersLoading, receivedEventUsers } from "../actions/eventUsers";

export function useEventUsers(eventUuid) {
  const pollRef = useRef(null);

  const authenticatedUser = supabase.auth.user();

  const { eventUsers = {}, dispatch } = useEventsContext();

  useEffect(() => {
    if (!authenticatedUser || !eventUuid) return;

    async function getUsersWithPayments() {
      dispatch(eventUsersLoading({ eventUuid, loading: true }));
      const { data: users, error } = await supabase.from('registered-users').select('*, payments:registered-user-payments(*)').eq('registered_event', eventUuid);
  
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
    loading: eventUsers.loading,
  };
};

export function useEventUser(eventUuid, userUuid) {
  const { eventUsers = {} } = useEventsContext();

  return {
    eventUser: get(eventUsers.users, `${eventUuid}.${userUuid}`, {}),
    loading: eventUsers.loading,
  };
};

export function useEvents() {
  const { events = {} } = useEventsContext();

  return events;
};
