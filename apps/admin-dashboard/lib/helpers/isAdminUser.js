import supabase from "../supabase";

export default function isAdminUser(supabaseInstance = supabase) {
  const appMetadata = supabaseInstance.auth.session()?.user?.app_metadata || {};

  return !!appMetadata.claims_admin;
};
