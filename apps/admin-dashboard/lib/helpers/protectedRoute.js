import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const protectedRoute = (inner) => async (context) => {
  const supabase = createServerSupabaseClient(context);

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { props: {}, redirect: { destination: '/login', permanent: false } };
  }

  const { user } = session

  if (inner) {
    return inner(context, { supabase, user });
  }

  return { props: {} };
};

export default protectedRoute;
