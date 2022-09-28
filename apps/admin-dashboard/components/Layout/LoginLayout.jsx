import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Image from 'next/image';
import useMediaQuery from '@mui/material/useMediaQuery';
import Typography from '@mui/material/Typography';

export default function LoginLayout({ title, children }) {
  const [ containerWidth, setContainerWidth ] = useState('100%');
  const isRegular = useMediaQuery('(max-width:1450px)');
  const isMedium = useMediaQuery('(max-width:1100px)');
  const isSmall = useMediaQuery('(max-width:820px)');

  useEffect(() => {
    if (isSmall) {
      setContainerWidth('100%');
    } else if (isMedium) {
      setContainerWidth('60%');
    } else if (isRegular) {
      setContainerWidth('40%');
    } else {
      setContainerWidth('30%');
    }
  }, [ isSmall, isMedium, isRegular ]);

  return (
    <>
      <Head>
        <title>{`${title} | Admin Dashboard | Reformation Life Centre - Events`}</title>
        <meta
          content={`${title} | Admin Dashboard | Reformation Life Centre - Events`}
          key="title"
          property="og:title"
        />
        <link href="/images/rlc-logo.ico" rel="icon" type="image/x-icon" />
      </Head>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          textAlign: 'center',
          minHeight: '95vh'
        }}
      >
        <div
          style={{
            padding: '0 1rem',
            width: containerWidth
          }}
        >
          <Image alt="RLC Admin Dashoard" height={170} src="/images/rlc-logo-globe.png" width={170} />
          <Typography
            fontWeight="bold"
            gutterBottom
            sx={{
              marginBottom: '2rem'
            }}
            variant="h5"
          >
            Events Dashboard
          </Typography>
          {children}
        </div>
      </div>
    </>
  );
};

LoginLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
