import isEmpty from "lodash/isEmpty";
import reduce from "lodash/reduce";

import getEventWithImgs from "../../helpers/getEventWithImgs";
import C from '../constants';

export const initialState = {
  events: {},
  loading: false,
  error: null,
};

const eventsReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case C.EVENTS_RECEIVED_EVENTS: {
      const events = reduce(payload, (next, event) => {
        const { data: eventWithImgs } = getEventWithImgs(event);

        next[event.uuid] = eventWithImgs;
        return next;
      }, {});

      return {
        ...state,
        events,
        loading: false,
      };
    }
    case C.EVENTS_RECEIVED_EVENTS: {
      const { data: eventWithImgs, error } = getEventWithImgs(payload);

      return {
        ...state,
        events: {
          ...state.events,
          [eventWithImgs.uuid]: eventWithImgs,
        },
        error,
      };
    }
    case C.EVENTS_UPDATE_EVENT:
    case C.EVENTS_INSERT_EVENT: {
      const { data: eventWithImgs, error } = getEventWithImgs(payload);

      return {
        ...state,
        events: {
          ...state.events,
          [eventWithImgs.uuid]: eventWithImgs,
        },
        error,
      };
    }
    case C.EVENTS_DELETE_EVENT: {
      const newEvents = { ...state.events };

      delete newEvents[payload.uuid];

      return {
        ...state,
        events: newEvents,
      };
    }
    case C.EVENTS_ERROR: {
      return {
        ...state,
        error: payload,
      };
    }
    case C.EVENTS_LOADING: {
      return {
        ...state,
        loading: isEmpty(state.events) ? payload : false,
      };
    }
    default: {
      return state || initialState;
    }
  };
};

export default eventsReducer;
