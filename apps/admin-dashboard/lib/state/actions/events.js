import C from '../constants';

export const eventsLoadingAction = (payload) => ({
  type: C.EVENTS_LOADING,
  payload
});

export const eventsErrorAction = (payload) => ({
  type: C.EVENTS_ERROR,
  payload
});

export const receivedEventsAction = (payload) => ({
  type: C.EVENTS_RECEIVED_EVENTS,
  payload
});

export const updateEvent = (payload) => ({
  type: C.EVENTS_UPDATE_EVENT,
  payload
});
