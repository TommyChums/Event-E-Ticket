import { useEffect, useReducer, useRef } from "react";
import isEmpty from 'lodash/isEmpty';

import supabase from "../supabase";

function getPublicURLForEventImgs(configObj) {
  const returnObj = {
    publicURL: '',
    err: false,
  };

  const { publicURL, error } = supabase.storage.from(configObj.bucket).getPublicUrl(configObj.key);

  if (error) returnObj.err = error.message;

  returnObj.publicURL = publicURL;

  return returnObj;
}

function setEventImgs(event) {
  const logoLocation = event.logo;
  const ticketLocation = event.ticket_template;
  let err = false;

  if (logoLocation) {
    const { publicURL, error } = getPublicURLForEventImgs(logoLocation);

    err = error;

    event.logo = publicURL;
  }

  if (ticketLocation) {
    const { publicURL, error } = getPublicURLForEventImgs(ticketLocation);

    err = error;

    event.ticket_template = publicURL;
  }

  event.ticket_config = ticketLocation.config || {};
  event.original_ticket_template = ticketLocation;

  return { data: event, error: err };
}

export default function useEvent(eventUuid) {
  const pollRef = useRef(null);

  const authenticatedUser = supabase.auth.user();
  supabase.auth.session();

  const [ state, dispatch ] = useReducer((state, { type, payload }) => {
    switch (type) {
      case 'RECEIVED_EVENT': {
        const { data: eventWithImgs, error } = setEventImgs(payload);

        return {
          ...state,
          event: eventWithImgs,
          error,
        };
      }
      case 'UPDATE':
      case 'INSERT': {
        const { data: eventWithImgs, error } = setEventImgs(payload.new);

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
