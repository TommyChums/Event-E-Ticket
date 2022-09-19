import React, { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual';
import QRCode from 'qrcode';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import isFinite from 'lodash/isFinite';
import Avatar from '@mui/material/Avatar';

export default function ResizableQrCode({ config, onChange, lightColour, darkColour }) {
  const [ positionSize, setPositionSize ] = useState({});
  const [ colour, setColour ] = useState({
    light: '#fff',
    dark: '#000',
  });

  const [ qrCode, setQrCode ] = useState();

  useEffect(() => {
    setPositionSize({
      x: isFinite(config.x) ? config.x : 0,
      y: isFinite(config.y) ? config.y : 0,
      h: isFinite(config.h) ? config.h : 204,
      w: isFinite(config.w) ? config.w : 204,
    });
  }, [ config ]);

  useEffect(() => {
    if (!isEqual(lightColour, colour.light)) {
      setColour({
        ...colour,
        light: lightColour,
      });
    }
    if (!isEqual(darkColour, colour.dark)) {
      setColour({
        ...colour,
        dark: darkColour,
      });
    }
  }, [ lightColour, darkColour, colour ]);

  useEffect(() => {
    (async () => {
      await new Promise((resolve) => {
        QRCode.toDataURL('The Scan Worked!', {
          type: 'image/png',
          color: {
            dark: colour?.dark,
            light: colour?.light,
          },
        }, (err, url) => {
          if (err) console.error(err);
          else {
            setQrCode(url);
          }
          resolve();
        });
      });
    })();
  }, [ colour ]);

  const updateSize = (size) => {
    if (onChange && typeof onChange === 'function') {
      onChange(size);
    } else {
      setPositionSize(size);
    }
  };

  const handleOnResize = (_, { size }) => {
    updateSize({
      ...positionSize,
      w: size.width,
      h: size.height,
    });
  };

  const handleOnMove = (_, { x, y }) => {
    updateSize({
      ...positionSize,
      x,
      y,
    });
  };

  return (
    <Draggable
      defaultPosition={{
        x: positionSize.x,
        y: positionSize.y,
      }}
      position={{
        x: positionSize.x,
        y: positionSize.y,
      }}
      scale={1}
      onDrag={handleOnMove}
      bounds="parent"
      cancel='.react-resizable-handle-se'
    >
      <ResizableBox
        width={positionSize.w}
        height={positionSize.h}
        minConstraints={[ 100, 100 ]}
        maxConstraints={[ 204, 204 ]}
        onResize={handleOnResize}
        lockAspectRatio
      >
        <Avatar imgProps={{ draggable: false }} sx={{ width: positionSize.w, height: positionSize.h }} variant="square" alt="QRCode" src={qrCode}>
          QRCode
        </Avatar>
      </ResizableBox>
    </Draggable>
  )
}
