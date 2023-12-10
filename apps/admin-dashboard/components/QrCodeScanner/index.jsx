import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import QrScanner from 'qr-scanner';
import CircularProgress from '@mui/material/CircularProgress';

function QrCodeScanner({ onError, onScan, style }) {
  const qrScanner = useRef(null);
  const [ videoRef, setVideoRef ] = useState(null);

  const [ videoLoaded, setVideoLoaded ] = useState(false);

  useEffect(() => {
    if (videoRef) {
      videoRef.onloadedmetadata = () => {
        setVideoLoaded(true);
      };

      const scanner = new QrScanner(
        videoRef,
        ({ data }) => onScan(data),
        {
          onDecodeError: onError,
          highlightCodeOutline: true,
          highlightScanRegion: true,
          preferredCamera: /Android|iPhone/i.test(navigator.userAgent) ? 'environment' : 'user',
        }
      );
      
      scanner.start();
      scanner.setInversionMode('both');
      scanner.setGrayscaleWeights(111, 111, 111, true);
  
      qrScanner.current = scanner;
    }
  }, [ videoRef, onError, onScan ]);

  useEffect(() => {
    return () => {
      if (qrScanner.current) {
        qrScanner.current.destroy();

        qrScanner.current = null;
      }
    };
  }, []);

  return (
    <>
      {!videoLoaded && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          transform: 'translateY(100%)',
        }}>
          <CircularProgress />
        </div>
      )}
      <video ref={setVideoRef} style={style}></video>
    </>
  );
};

export default React.memo(QrCodeScanner);

QrCodeScanner.propTypes = {
  onError: PropTypes.func,
  onScan: PropTypes.func,
  style: PropTypes.object,
};

QrCodeScanner.defaultProps = {
  onError: () => {},
  onScan: () => {},
  style: null,
};
