import React, { useEffect, useRef, useState } from 'react'
import Button from '@mui/material/IconButton';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function ImgUpload({ avatar, onUpload, defaultValue, value }) {
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
        // Resize the image
        const canvas = document.createElement('canvas');
        const width = 530;
        const height = 204;

        canvas.width = width;
        canvas.height = height;

        canvas.getContext('2d').drawImage(image, 0, 0, width, height);

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
    <div style={{ position: 'relative', textAlign: 'initial', width: 'max-content' }}>
      <Button
        sx={{ padding: 0, position: 'absolute', top: '50%', left: '50%', margin: 0, transform: 'translate(-50%, -50%)', zIndex: 2 }}
        onClick={() => uploadInputRef.current?.click()}
      >
        <UploadFileIcon fontSize="large" />
      </Button>
      {
        avatar ? (
          <Stack>
            <Avatar alt="" src={imgSrc} sx={{ width: 120, height: 120, alignSelf: 'center' }}>
              Event Logo
            </Avatar>
          <Typography component="label" htmlFor="largeImg" variant="subtitle2" sx={{ alignSelf: 'center', fontStyle: 'italic', opacity: 0.6 }}>
              1.25&quot; x 1.25&quot;
            </Typography>
          </Stack>
        ) : (
          <Stack>
            <Avatar id="largeImg" variant="square" alt="" src={imgSrc} sx={{ width: 530, height: 204, alignSelf: 'center' }}>
              Event Ticket
            </Avatar>
            <Typography component="label" htmlFor="largeImg" variant="subtitle2" sx={{ alignSelf: 'center', fontStyle: 'italic', opacity: 0.6 }}>
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
    </div>
  )
}
