import { createContext, useReducer } from 'react';
import PropTypes from 'prop-types';

import eventsReducer, { initialState as initialEventsState } from '../reducers/events';
import eventUsersReducer, { initialState as initialEventUsersState } from '../reducers/eventUsers';

const initialState = {
  events: initialEventsState,
  eventUsers: initialEventUsersState
};

const reducer = (state, action) => ({
  events: eventsReducer(state.events, action),
  eventUsers: eventUsersReducer(state.eventUsers, action)
});

export const AppContext = createContext(initialState);

export default function EventsProvider({ children }) {
  const [ state, dispatch ] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

EventsProvider.propTypes = {
  children: PropTypes.node.isRequired
};
