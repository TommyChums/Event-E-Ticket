import Auth from '../components/Auth';
import LoginLayout from '../components/Layout/LoginLayout';
import supabase from '../lib/supabase';

export default function LoginPage({ updatePassword = false }) {
  return (
    <LoginLayout title={updatePassword ? 'Update Password' : 'Login'}>
      <Auth
        updatePassword={updatePassword}
        redirectTo="/events"
      />
    </LoginLayout>
  );
};

export async function getServerSideProps(context) {
  const { req } = context;

  const { user } = await supabase.auth.api.getUserByCookie(req);

  const needsPasswordUpdate = user?.user_metadata?.temp_password;

  if (needsPasswordUpdate) {
    return {
      props: { updatePassword: true },
    };
  } else if (user) {
    return { props: {}, redirect: { destination: '/events', permanent: false } };
  }

  return { props: {} };
};
