import UsersTable from "../components/UsersTable";
import { useAppContext } from "../context/UsersAndEvents";

export default function Web() {
  const { users, event, loading } = useAppContext();

  return (
    <UsersTable
      loading={loading}
      users={users}
      usersEvent={event}
    />
  );
};
