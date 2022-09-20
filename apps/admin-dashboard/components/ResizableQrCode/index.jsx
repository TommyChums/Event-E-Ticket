import React, { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual';
import QRCode from 'qrcode';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import isFinite from 'lodash/isFinite';
import reduce from 'lodash/reduce';
import Avatar from '@mui/material/Avatar';

export default function ResizableQrCode({ scale = 1, maxHeight, config = {}, onChange, lightColour, darkColour }) {
  const [ positionSize, setPositionSize ] = useState({
    x: isFinite(config.x) ? config.x / scale: 0,
    y: isFinite(config.y) ? config.y / scale: 0,
    h: isFinite(config.h) ? config.h / scale: maxHeight,
    w: isFinite(config.w) ? config.w / scale: maxHeight,
  });

  const [ colour, setColour ] = useState({
    light: '#fff',
    dark: '#000',
  });

  const [ qrCode, setQrCode ] = useState();

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
    const scaledSize = reduce(size, (next, val, key) => {
      next[key] = val * scale;
      return next;
    }, {});

    if (onChange && typeof onChange === 'function') {
      onChange(scaledSize);
    }

    setPositionSize(size);
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
      onDrag={handleOnMove}
      bounds="parent"
      cancel='.react-resizable-handle-se'
    >
      <ResizableBox
        width={positionSize.w}
        height={positionSize.h}
        minConstraints={[ 100, 100 ]}
        maxConstraints={[ maxHeight, maxHeight ]}
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
