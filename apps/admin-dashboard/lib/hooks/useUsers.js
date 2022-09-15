import { useEffect, useReducer, useRef } from "react";
import isEmpty from 'lodash/isEmpty';
import keyBy from 'lodash/keyBy';

import supabase from "../supabase";

export default function useUsers(eventUuid) {
  const pollRef = useRef(null);

  const authenticatedUser = supabase.auth.user();

  const [ state, dispatch ] = useReducer((state, { type, payload }) => {
    switch (type) {
      case 'RECEIVED_USERS': {
        return {
          ...state,
          users: {
            ...state.users,
            ...payload,
          },
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
          isLoading: isEmpty(state.users) ? payload : false,
        };
      }
      default: {
        return state;
      }
    };
  }, { users: {}, isLoading: true, error: false });

  
  useEffect(() => {
    if (!authenticatedUser || !eventUuid) return;

    async function getUsersWithPayments() {
      dispatch({ type: 'LOADING', payload: true });
      const { data: users, error } = await supabase.from('registered-users').select('*, payments:registered-user-payments(*)').eq('registered_event', eventUuid);
  
      if (error) {
        dispatch({ type: 'ERROR', payload: error });
      }
  
      dispatch({ type: 'RECEIVED_USERS', payload: keyBy(users, 'uuid') });
      dispatch({ type: 'LOADING', payload: false });
    };

    getUsersWithPayments();

    if (!pollRef.current) {
      pollRef.current = setInterval(() => {
        getUsersWithPayments();
      }, 30 * 1000);
    }

    return () => {
      clearInterval(pollRef.current);
    };
  }, [ authenticatedUser, eventUuid ]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    users: state.users,
    updateUser: (user) => dispatch({ type: 'UPDATE', payload: { new: user } }),
    updatePayment: (payment) => dispatch({ type: 'PAYMENT-UPDATE', payload: { new: payment } }),
  };
};
