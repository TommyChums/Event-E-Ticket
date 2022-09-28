import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/IconButton';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function ImgUpload({
  avatar,
  disabled,
  name,
  onUpload,
  defaultValue,
  value,
  maxWidth,
  maxHeight,
  width,
  height,
  altText,
  children = null,
  sizeText
}) {
  const uploadInputRef = useRef(null);
  const [ imgSrc, setImgSrc ] = useState(value);

  useEffect(() => {
    setImgSrc(value || defaultValue);
  }, [ value, defaultValue ]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.addEventListener('load', function () {
      const image = new Image();
      image.onload = function () {
        const canvas = document.createElement('canvas');

        canvas.width = maxWidth;
        canvas.height = maxHeight;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0, maxWidth, maxHeight);

        const dataUrl = canvas.toDataURL(file.type);

        if (onUpload && typeof onUpload === 'function') {
          onUpload(dataUrl);
        } else {
          setImgSrc(dataUrl);
        }
      };

      image.src = this.result;
    });

    reader.readAsDataURL(file);
  };


  return (
    <Stack justifyContent="center" position="relative" width="100%">
      {
        !disabled &&
          <Button
            onClick={() => uploadInputRef.current?.click()}
            sx={{
              padding: 0,
              position: 'absolute',
              top: '42.26%',
              left: '50%',
              margin: 0,
              transform: 'translate(-50%, -50%)',
              zIndex: 2
            }}
          >
            <UploadFileIcon fontSize="large" />
          </Button>

      }
      {
        avatar ?
          <Stack>
            <Avatar
              alt=""
              id={`avatar-${name || 1}`}
              src={imgSrc}
              sx={{
                width,
                height,
                alignSelf: 'center'
              }}
            >
              {altText}
            </Avatar>
            <Typography
              component="label"
              htmlFor={`avatar-${name || 1}`}
              sx={{
                alignSelf: 'center',
                fontStyle: 'italic',
                opacity: 0.6
              }}
              variant="subtitle2"
            >
              {sizeText || '1.25" x 1.25"'}
            </Typography>
          </Stack>
          :
          <Stack>
            <Avatar
              alt=""
              id={`rectangle-${name || 1}`}
              src={imgSrc}
              sx={{
                width,
                height,
                alignSelf: 'center'
              }}
              variant="square"
            >
              {altText}
            </Avatar>
            <Typography
              component="label"
              htmlFor={`rectangle-${name || 1}`}
              sx={{
                alignSelf: 'center',
                fontStyle: 'italic',
                opacity: 0.6
              }}
              variant="subtitle2"
            >
              {sizeText || '5.5" x 2.125"'}
            </Typography>
          </Stack>

      }
      <input
        accept={'image/*'}
        onChange={handleUpload}
        ref={uploadInputRef}
        style={{ display: 'none' }}
        type="file"
      />
      {children}
    </Stack>
  );
};

ImgUpload.propTypes = {
  avatar: PropTypes.bool,
  disabled: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  maxWidth: PropTypes.number.isRequired,
  maxHeight: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  altText: PropTypes.string.isRequired,
  children: PropTypes.node,
  sizeText: PropTypes.string
};

ImgUpload.defaultProps = {
  avatar: false,
  defaultValue: '',
  disabled: false,
  children: null,
  sizeText: '',
  value: undefined,
};
