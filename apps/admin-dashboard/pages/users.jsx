import UsersTable from "../components/UsersTable";
import { useAppContext } from "../context/UsersAndEvents";
import protectedRoute from "../lib/helpers/protectedRoute";

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

export const getServerSideProps = protectedRoute();
