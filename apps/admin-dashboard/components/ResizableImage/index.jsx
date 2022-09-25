import React, { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual';
import QRCode from 'qrcode';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import isFinite from 'lodash/isFinite';
import reduce from 'lodash/reduce';
import Avatar from '@mui/material/Avatar';

const getScaledConfig = (config, scale, maxHeight, maxWidth, isNumberType) => ({
  x: isFinite(config.x) ? config.x / scale: 0,
  y: isFinite(config.y) ? config.y / scale: 0,
  h: isFinite(config.h) ? config.h / scale: isNumberType ? 115 : maxHeight,
  w: isFinite(config.w) ? config.w / scale: isNumberType ? 40 : maxWidth,
})

export default function ResizableImage({ scale = 1, disabled, maxHeight, maxWidth, config = {}, onChange, lightColour, darkColour, type = 'qrcode' }) {
  const thisMaxWidth = typeof maxWidth !== 'undefined' ? maxWidth : maxHeight;
  const isNumber = type === 'number';

  const [ positionSize, setPositionSize ] = useState(getScaledConfig(config, scale, maxHeight, thisMaxWidth, isNumber));

  const [ colour, setColour ] = useState({
    light: '#fff',
    dark: '#000',
  });

  const [ resizableImage, setResizableImage ] = useState();

  const resizeHandles = document.querySelectorAll('.react-resizable-handle-se');

  useEffect(() => {
    resizeHandles.forEach((el) => {
      el.style.pointerEvents = 'auto';
    });
  }, [ resizeHandles ]);

  useEffect(() => {
    const scaledConfig = getScaledConfig(config, scale, maxHeight, thisMaxWidth, isNumber);

    if (!isEqual(scaledConfig, positionSize)) {
      setPositionSize(scaledConfig);
    }
  }, [ config, scale, maxHeight, thisMaxWidth, isNumber ]);

  useEffect(() => {
    const newColour = {
      ...colour,
    };

    const lightColourIsNotSame = !isEqual(lightColour, colour.light);
    const darkColourIsNotSame = !isEqual(darkColour, colour.dark);

    if (lightColourIsNotSame) {
      newColour.light = lightColour;
    }

    if (darkColourIsNotSame) {
      newColour.dark = darkColour;
    }

    if (lightColourIsNotSame || darkColourIsNotSame) {
      setColour(newColour);
    }
  }, [ lightColour, darkColour, colour ]);

  useEffect(() => {
    if (type === 'qrcode') {
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
              setResizableImage(url);
            }
            resolve();
          });
        });
      })();
    }
  }, [ colour, type, thisMaxWidth, maxHeight ]);

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

  const handleOnInternalResize = (_, { size }) => {
    setPositionSize({
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
      disabled={disabled}
      defaultPosition={{
        x: positionSize.x,
        y: positionSize.y,
      }}
      position={{
        x: positionSize.x,
        y: positionSize.y,
      }}
      onStop={handleOnMove}
      bounds="parent"
      cancel='.react-resizable-handle-se'
    >
      {
        isNumber ? (
          <p
            id="number-node"
            style={{
              fontSize: `${42 / scale}px`,
              fontWeight: '1000',
              color: colour?.dark,
              backgroundColor: colour?.light,
              pointerEvents: 'auto',
              width: 'max-content', height: 'max-content',
              textAlign: 'center',
              verticalAlign: 'center',
              padding: `${20 / scale}px ${10 / scale}px`,
              margin: 0,
              lineHeight: 0,
            }}
          >
            0001
        </p>
        ) : (
        <ResizableBox
          width={positionSize.w}
          height={positionSize.h}
          resizeHandles={disabled || isNumber ? [] : [ 'se' ]}
          minConstraints={isNumber ? [ 0, 0 ] : [ 100, 100 ]}
          maxConstraints={[ maxHeight, thisMaxWidth ]}
          onResize={handleOnInternalResize}
          onResizeStop={handleOnResize}
          lockAspectRatio
          draggableOpts={{
            disabled: disabled,
          }}
          style={{
            pointerEvents: !isNumber ? 'auto' : 'none',
          }}
        >

          <Avatar style={{ pointerEvents: 'auto' }} imgProps={{ draggable: false }} sx={{ width: positionSize.w, height: positionSize.h }} variant="square" alt={type} src={resizableImage}>
            {type}
          </Avatar>
        </ResizableBox>
        )
      }
    </Draggable>
  );
};
