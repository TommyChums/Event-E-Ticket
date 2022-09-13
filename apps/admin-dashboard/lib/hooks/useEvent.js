import { useEffect, useReducer } from "react";

import supabase from "../supabase";

export default function useEvent(eventUuid) {
  const authenticatedUser = supabase.auth.user();

  const [ state, dispatch ] = useReducer((state, { type, payload }) => {
    switch (type) {
      case 'RECEIVED_EVENT': {
        return {
          ...state,
          event: payload,
        };
      }
      case 'UPDATE':
      case 'INSERT': {
        return {
          ...state,
          event: payload.new,
        };
      }
      case 'DELETE': {
        return {
          ...state,
          event: {}
        };
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
  }, { event: {}, isLoading: true, error: false });


  useEffect(() => {
    if (!authenticatedUser) return;
    (async () => {
      dispatch({ type: 'LOADING', payload: true });
      const { data: event, error } = await supabase.from('events').select('*').eq('uuid', eventUuid).single();

      if (error) {
        dispatch({ type: 'ERROR', payload: error });
      }

      dispatch({ type: 'RECEIVED_EVENT', payload: event });
      dispatch({ type: 'LOADING', payload: false });
    })();

    const subscription = supabase.from(`events:uuid=eq.${eventUuid}`).on('*', (payload) => {
      dispatch({ type: payload.eventType, payload });
    }).subscribe();

    return () => supabase.removeSubscription(subscription);
  }, [ authenticatedUser, eventUuid ]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    event: state.event,
  };
};
