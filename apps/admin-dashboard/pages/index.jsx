import React from 'react';
import protectedRoute from '../lib/helpers/protectedRoute';

export default function index() {
  return (
    <div>index</div>
  );
};

export const getServerSideProps = protectedRoute(() => ({
  redirect: {
    destination: '/events',
    permanent: false
  }
}));
