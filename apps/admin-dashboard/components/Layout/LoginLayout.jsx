import { useEffect, useState } from 'react';
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
        <meta property="og:title" content={`${title} | Admin Dashboard | Reformation Life Centre - Events`} key="title" />
        <link rel="icon" type="image/x-icon" href="/images/rlc-logo.ico" />
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
          <Image width={170} height={170} src="/images/rlc-logo-globe.png" alt="RLC Admin Dashoard" />
          <Typography sx={{ marginBottom: '2rem' }} variant="h5" gutterBottom fontWeight="bold">Events Dashboard</Typography>
          {children}
        </div>
      </div>
    </>
  );
};
