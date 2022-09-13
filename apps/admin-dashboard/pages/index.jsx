import { useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

import Auth from '../components/Auth';

export default function Home() {
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
        <Auth
          redirectTo="/users"
        />
      </div>
    </div>
  );
};
