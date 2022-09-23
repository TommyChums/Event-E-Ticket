import supabase from '../supabase';

const protectedRoute = (inner) => {
  return async (context) => {
    const { req } = context;
    const { user, token } = await supabase.auth.api.getUserByCookie(req);

    if (!user) {
      return { props: {}, redirect: { destination: '/login', permanent: false } };
    }

    if (inner) {
      supabase.auth.session = () => ({
        access_token: token,
        token_type: "",
        user,
      });

      return inner(context, supabase);
    }

    return { props: {} };
  };
};

export default protectedRoute;
