import React from 'react'

export default function NotFound(props) {
  return (
    <div>NotFound</div>
  );
};

export function getStaticProps() {
  return {
    props: {
      notFound: true,
    },
  };
};