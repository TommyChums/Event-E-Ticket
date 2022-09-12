import { useEffect, useReducer } from "react";
import keyBy from 'lodash/keyBy';

import supabase from "../supabase";

export default function useUsers() {
  const [ state, dispatch ] = useReducer((state, { type, payload }) => {
    switch (type) {
      case 'RECEIVED_USERS': {
        return {
          ...state,
          users: payload,
        };
      }
      case 'UPDATE':
      case 'INSERT': {
        return {
          ...state,
          users: {
            ...state.users,
            [payload.new.uuid]: payload.new,
          },
        };
      }
      case 'DELETE': {
        const updatedState = {
          ...state,
        };

        delete state.users[payload.old.uuid];

        return updatedState;
      }
      case 'ERROR': {
        return {
          ...state,
          error: payload,
        };
      }
      case 'LOADING': {
        return {
          ...state,
          isLoading: payload,
        };
      }
      default: {
        return state;
      }
    };
  }, { users: {}, isLoading: false, error: false });

  useEffect(() => {
    (async () => {
      dispatch({ type: 'LOADING', payload: true });
      const { data: users, error } = await supabase.from('registered-users').select('*');

      if (error) {
        dispatch({ type: 'ERROR', payload: error });
      }

      dispatch({ type: 'RECEIVED_USERS', payload: keyBy(users, 'uuid') });
      dispatch({ type: 'LOADING', payload: false });
    })();

    const subscription = supabase.from('registered-users').on('*', (payload) => {
      dispatch({ type: payload.eventType, payload });
    }).subscribe();

    return () => supabase.removeSubscription(subscription);
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    users: state.users,
  };
}
