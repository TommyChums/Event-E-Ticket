import { useEffect, useReducer, useRef } from "react";
import keyBy from 'lodash/keyBy';

import supabase from "../supabase";

export default function useUsers() {
  const authenticatedUser = supabase.auth.user();

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
            [payload.new.uuid]: {
              ...(state.users[payload.new.uuid] ||{}),
              ...payload.new,
            },
          },
        };
      }
      case 'PAYMENT-UPDATE':
      case 'PAYMENT-INSERT': {
        const paymentUserUuid = payload.new.user_uuid;

        if (!state.users[paymentUserUuid]) return state;

        const payments = keyBy(state.users[paymentUserUuid].payments, 'uuid');

        payments[payload.new.uuid] = payload.new;

        return {
          ...state,
          users: {
            ...state.users,
            [paymentUserUuid]: {
              ...state.users[paymentUserUuid],
              payments: Object.values(payments),
            },
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
  }, { users: {}, isLoading: true, error: false });

  useEffect(() => {
    if (!authenticatedUser) return;
    (async () => {
      dispatch({ type: 'LOADING', payload: true });
      const { data: users, error } = await supabase.from('registered-users').select('*, payments:registered-user-payments(*)');

      if (error) {
        dispatch({ type: 'ERROR', payload: error });
      }

      dispatch({ type: 'RECEIVED_USERS', payload: keyBy(users, 'uuid') });
      dispatch({ type: 'LOADING', payload: false });
    })();

    const usersSubscription = supabase.from('registered-users').on('*', (payload) => {
      dispatch({ type: payload.eventType, payload });
    }).subscribe();

    const paymentsSubscription = supabase.from('registered-user-payments').on('*', (payload) => {
      dispatch({ type: `PAYMENT-${payload.eventType}`, payload });
    }).subscribe();

    return () => {
      supabase.removeSubscription(usersSubscription);
      supabase.removeSubscription(paymentsSubscription);
    };
  }, [ authenticatedUser ]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    users: state.users,
  };
};
