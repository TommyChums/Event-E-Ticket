import { useEffect, useReducer, useRef } from "react";
import isEmpty from 'lodash/isEmpty';

import getEventWithImgs from "../helpers/getEventWithImgs";
import supabase from "../supabase";

export default function useEvent(eventUuid) {
  const pollRef = useRef(null);

  const authenticatedUser = supabase.auth.user();
  supabase.auth.session();

  const [ state, dispatch ] = useReducer((state, { type, payload }) => {
    switch (type) {
      case 'RECEIVED_EVENT': {
        const { data: eventWithImgs, error } = getEventWithImgs(payload);

        return {
          ...state,
          event: eventWithImgs,
          error,
        };
      }
      case 'UPDATE':
      case 'INSERT': {
        const { data: eventWithImgs, error } = getEventWithImgs(payload.new);

        return {
          ...state,
          event: eventWithImgs,
          error,
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
          isLoading: isEmpty(state.event) ? payload : false,
        };
      }
      default: {
        return state;
      }
    };
  }, { event: {}, isLoading: true, error: false });

  useEffect(() => {
    if (!authenticatedUser || !eventUuid) return;

    async function getEvent() {
      dispatch({ type: 'LOADING', payload: true });
      const { data: event, error } = await supabase.from('events').select('*').eq('uuid', eventUuid).single();
  
      if (error) {
        dispatch({ type: 'ERROR', payload: error });
      }
  
      dispatch({ type: 'RECEIVED_EVENT', payload: event });
      dispatch({ type: 'LOADING', payload: false });
    };

    getEvent();

    if (!pollRef.current) {
      pollRef.current = setInterval(() => {
        getEvent();
      }, 60 * 1000);
    }

    return () => {
      clearInterval(pollRef.current);
    };
  }, [ authenticatedUser, eventUuid ]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    event: state.event,
    updateEvent: (event) => dispatch({ type: 'UPDATE', payload: { new: event } }),
  };
};
