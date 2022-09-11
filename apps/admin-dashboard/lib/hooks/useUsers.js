import { useEffect, useState } from "react";
import keyBy from 'lodash/keyBy';

import supabase from "../supabase";

export default function useUsers() {
  const [ registeredUsers, setRegisteredUsers ] = useState({});
  const [ error, setError ] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: users, error } = await supabase.from('registered-users').select('*');

      if (error) {
        setError(error);
      }

      setRegisteredUsers(keyBy(users, 'uuid'));
    })()

    const subscription = supabase.from('registered-users')
      .on('*', (payload) => {
        console.log('payload:', payload);

        const newRecord = payload.new;

        setRegisteredUsers({
          ...registeredUsers,
          [newRecord.uuid]: newRecord,
        });
      }).subscribe();

    return () => supabase.removeSubscription(subscription);
  }, [ registeredUsers ]);

  return {
    isLoading: !registeredUsers || !Object.keys(registeredUsers).length,
    error,
    users: registeredUsers,
  };
}
