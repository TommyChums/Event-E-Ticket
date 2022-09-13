import UsersTable from "../components/UsersTable";
import useUsers from "../lib/hooks/useUsers";

export default function Web() {
  const { error, isLoading, users } = useUsers();

  if (error) {
    return (
      <div>
        Error loading users
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <UsersTable
        users={Object.values(users)}
      />
    </div>
  );
};
