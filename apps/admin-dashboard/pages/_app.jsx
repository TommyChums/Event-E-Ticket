import React from 'react';
import Layout from '../components/Layout';
import { AppWrapper } from '../context/UsersAndEvents';

export default function App({ Component, pageProps }) {

  return (
    <AppWrapper>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppWrapper>
  );
};
