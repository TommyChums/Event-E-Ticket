import PropTypes from 'prop-types';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

import Auth from '../components/Auth';
import LoginLayout from '../components/Layout/LoginLayout';

export default function LoginPage({ updatePassword }) {
  return (
    <LoginLayout title={updatePassword ? 'Update Password' : 'Login'}>
      <Auth
        redirectTo="/events"
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
    return { props: {} };
  }

  const { user } = session;

  const needsPasswordUpdate = user?.user_metadata?.temp_password;

  if (needsPasswordUpdate) {
    return {
      props: { updatePassword: true }
    };
  } else if (user) {
    return { props: {}, redirect: { destination: '/events', permanent: false } };
  }
};

LoginPage.propTypes = {
  updatePassword: PropTypes.bool
};

LoginPage.defaultProps = {
  updatePassword: false
};
