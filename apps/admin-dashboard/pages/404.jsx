import React from 'react';

export default function NotFound() {
  return (
    <div>NotFound</div>
  );
};

export function getStaticProps() {
  return {
    props: {
      notFound: true
    }
  };
};
