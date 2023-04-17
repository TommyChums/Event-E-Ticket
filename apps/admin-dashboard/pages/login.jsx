import PropTypes from 'prop-types';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

import Auth from '../components/Auth';
import LoginLayout from '../components/Layout/LoginLayout';

export default function LoginPage({ redirectTo, updatePassword }) {
  return (
    <LoginLayout title={updatePassword ? 'Update Password' : 'Login'}>
      <Auth
        redirectTo={redirectTo}
        updatePassword={updatePassword}
      />
    </LoginLayout>
  );
};

export async function getServerSideProps(context) {
  const supabase = createServerSupabaseClient(context);

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { props: { redirectTo: '/login' } };
  }

  const { user } = session;

  const needsPasswordUpdate = user?.user_metadata?.temp_password;

  if (needsPasswordUpdate) {
    return {
      props: { redirectTo: '/events', updatePassword: true }
    };
  } else if (user) {
    return { props: { redirectTo: '/events' }, redirect: { destination: '/events', permanent: false } };
  }
};

LoginPage.propTypes = {
  updatePassword: PropTypes.bool
};

LoginPage.defaultProps = {
  updatePassword: false
};
