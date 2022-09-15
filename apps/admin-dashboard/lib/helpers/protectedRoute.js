import supabase from '../supabase';

const protectedRoute = (inner) => {
  return async (context) => {
    const { req } = context;
    const { user } = await supabase.auth.api.getUserByCookie(req);

    if (!user) {
      return { props: {}, redirect: { destination: '/login', permanent: false } };
    }

    if (inner) {
      return inner(context);
    }

    return { props: {} };
  };
};

export default protectedRoute;
