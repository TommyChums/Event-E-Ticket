import React from 'react';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <Layout {...pageProps}>
      <Component {...pageProps} />
    </Layout>
  );
};
