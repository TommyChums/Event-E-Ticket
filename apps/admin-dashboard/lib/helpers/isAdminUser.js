export default function isAdminUser(user) {
  const appMetadata = user?.app_metadata || {};

  return !!appMetadata.claims_admin;
};
