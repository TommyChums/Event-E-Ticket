import get from 'lodash/get';

import useEventsContext from "../../hooks/useEventsContext";

export function useEvent(eventUuid) {
  const { events = {} } = useEventsContext();

  return {
    event: get(events.events, eventUuid, {}),
    loading: events.loading,
  };
};

export function useEvents() {
  const { events = {} } = useEventsContext();

  return {
    events: events.events,
    loading: events.loading,
  };
};
