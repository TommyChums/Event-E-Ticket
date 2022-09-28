import PropTypes from 'prop-types';

import Auth from '../components/Auth';
import LoginLayout from '../components/Layout/LoginLayout';
import supabase from '../lib/supabase';

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
  const { req } = context;

  const { user } = await supabase.auth.api.getUserByCookie(req);

  const needsPasswordUpdate = user?.user_metadata?.temp_password;

  if (needsPasswordUpdate) {
    return {
      props: { updatePassword: true }
    };
  } else if (user) {
    return { props: {}, redirect: { destination: '/events', permanent: false } };
  }

  return { props: {} };
};

LoginPage.propTypes = {
  updatePassword: PropTypes.bool
};

LoginPage.defaultProps = {
  updatePassword: false
};
