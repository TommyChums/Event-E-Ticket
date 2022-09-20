import React, { useEffect, useRef, useState } from 'react'
import Button from '@mui/material/IconButton';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function ImgUpload({ avatar, name, onUpload, defaultValue, value, maxWidth, maxHeight, width, height, altText, children = null }) {
  const uploadInputRef = useRef(null);
  const [ imgSrc, setImgSrc ] = useState(value);

  useEffect(() => {
    setImgSrc(value || defaultValue);
  }, [ value, defaultValue ]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.addEventListener("load", function() {
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
      }

      image.src = this.result;
    });

    reader.readAsDataURL(file);
  };


  return (
    <Stack position="relative" width="100%" justifyContent="center">
      <Button
        sx={{ padding: 0, position: 'absolute', top: '42.26%', left: '50%', margin: 0, transform: 'translate(-50%, -50%)', zIndex: 2 }}
        onClick={() => uploadInputRef.current?.click()}
      >
        <UploadFileIcon fontSize="large" />
      </Button>
      {
        avatar ? (
          <Stack>
            <Avatar id={`avatar-${name || 1}`} alt="" src={imgSrc} sx={{ width, height, alignSelf: 'center' }}>
              {altText}
            </Avatar>
            <Typography component="label" htmlFor={`avatar-${name || 1}`} variant="subtitle2" sx={{ alignSelf: 'center', fontStyle: 'italic', opacity: 0.6 }}>
              1.25&quot; x 1.25&quot;
            </Typography>
          </Stack>
        ) : (
          <Stack>
            <Avatar id={`rectangle-${name || 1}`} variant="square" alt="" src={imgSrc} sx={{ width, height, alignSelf: 'center' }}>
              {altText}
            </Avatar>
            <Typography component="label" htmlFor={`rectangle-${name || 1}`} variant="subtitle2" sx={{ alignSelf: 'center', fontStyle: 'italic', opacity: 0.6 }}>
              5.5&quot; x 2.125&quot;
            </Typography>
          </Stack>
        )
      }
      <input
        type="file"
        accept={`image/*`}
        ref={uploadInputRef}
        onChange={handleUpload}
        style={{display: "none"}}
      />
      {children}
    </Stack>
  )
}
