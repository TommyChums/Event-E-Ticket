import UsersTable from "../components/UsersTable";
import useUsers from "../lib/hooks/useUsers";
import useEvent from "../lib/hooks/useEvent";

export default function Web() {
  const { error, isLoading, users } = useUsers();
  const { event: usersEvent, isLoading: eventLoading } = useEvent('16e9856f-4caf-478d-a553-b7e3ae9c86a0');

  if (error) {
    return (
      <div>
        Error loading users
      </div>
    );
  }

  return (
    <div>
      <UsersTable
        users={Object.values(users)}
        loading={isLoading || eventLoading}
        usersEvent={usersEvent}
      />
    </div>
  );
};
