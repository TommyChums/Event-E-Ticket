import { useEffect, useState } from "react";
import keyBy from 'lodash/keyBy';
import { Button } from "ui";

import supabase from "../lib/supabase";

export default function Web() {
  const [ users, setUsers ] = useState({});
  const [ loading, setLoading ] = useState(false);

  const mergeRecord = (newRecord) => {
    console.log('newRecord:', newRecord);
    setUsers({
      ...newRecord,
      ...users,
    });
  };

  const subscription = supabase.from('registered-users')
    .on('*', mergeRecord)
    .subscribe();

  // useEffect(() => {
  //   (async () => {
  //     setLoading(true);
  //     const { data } = await supabase.from('registered-users').select()
  //     setUsers(keyBy(data, 'uuid'));
  //     setLoading(false);
  //   })();

  //   return () => supabase.removeSubscription(subscription);
  // }, []);

  if (loading) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <div>
      {
        Object.values(users).map(user => <div key={user.uuid}>{user.first_name}</div>)
      }
    </div>
  );
}
