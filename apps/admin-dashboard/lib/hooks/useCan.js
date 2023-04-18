import { useUser } from '@supabase/auth-helpers-react';
import CONSTANTS from "../state/constants";

const {
  RBAC: {
    ACTIONS,
    SUBJECTS,
  },
  ROLES
} = CONSTANTS;


const DEFINED_RULES = {
  [ROLES.ADMIN]: {
    [SUBJECTS.ALL]: [
      ACTIONS.MANAGE,
    ],
  },
  [ROLES.EVENT_MANAGER]: {
    [SUBJECTS.EVENTS]: [
      ACTIONS.EDIT,
      ACTIONS.VIEW,
    ],
    [SUBJECTS.USERS]: [
      ACTIONS.MANAGE,
    ],
    [SUBJECTS.PAYMENTS]: [
      ACTIONS.MANAGE,
    ],
    [SUBJECTS.TICKETS]: [
      ACTIONS.MANAGE,
    ],
  },
  [ROLES.USER_MANAGER]: {
    [SUBJECTS.USERS]: [
      ACTIONS.MANAGE,
    ],
    [SUBJECTS.PAYMENTS]: [
      ACTIONS.MANAGE,
    ],
    [SUBJECTS.TICKETS]: [
      ACTIONS.ISSUE,
      ACTIONS.SCAN,
    ]
  },
  [ROLES.SCANNER]: {
    [SUBJECTS.USERS]: [
      ACTIONS.VIEW,
    ],
    [SUBJECTS.TICKETS]: [
      ACTIONS.SCAN,
    ],
  }
};

const useCan = () => {
  const user = useUser();

  const userRole = user?.app_metadata?.role;

  const isAllowed = (action, subject) => {
    let can = false;

    const rules = DEFINED_RULES[userRole] || {};
    const allSubject = rules[SUBJECTS.ALL];
    const currentSubject = rules[subject];

    if (allSubject) {
      can = allSubject.includes(ACTIONS.MANAGE) || allSubject.includes(action);
    }

    if (currentSubject) {
      can = can || currentSubject.includes(ACTIONS.MANAGE) || currentSubject.includes(action);
    }

    return can;
  };

  return {
    can: (action, subject) => isAllowed(action, subject),
    cannot: (action, subject) => !isAllowed(action, subject),
  };
};

export default useCan;
