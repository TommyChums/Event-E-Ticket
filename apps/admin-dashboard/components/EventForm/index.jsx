import React, { useEffect, useState } from 'react'
import { Controller, useController, useForm } from 'react-hook-form';
import { decode } from 'base64-arraybuffer';
import { v4 } from 'uuid';
import { ColorPicker, toColor } from "react-color-palette";
import moment from 'moment';
import isEqual from 'lodash/isEqual';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { usePlacesWidget } from "react-google-autocomplete";
import Alert from '@mui/material/Alert';

import PricingDialog from './PricingDialog';
import ImgUpload from '../ImgUpload';
import supabase from '../../lib/supabase';
import ResizableQrCode from '../ResizableQrCode';

function preventEnterSubmit(e) {
  if (e.code.toLowerCase() === 'enter') e.preventDefault();
};

async function replaceStorageImg(b64ImgData, bucket, eventUuid, oldPath) {
  const contentType = b64ImgData.split(';')[0].replace('data:', '');
  const extension = contentType.split('/')[1];
  const imgArrayBuffer = decode(b64ImgData.split(',')[1]);
  
  const { data, error } = await supabase.storage.from(bucket)
    .upload(`${eventUuid}/${v4()}.${extension}`, imgArrayBuffer, { contentType, upsert: true });
  
  if (!error) {
    // Remove old img
    if (oldPath) {
      const oldFileName = oldPath.split(`${bucket}/`).pop();

      if (oldFileName)
        await supabase.storage.from(bucket).remove(oldFileName)
    }
  }

  return {
    imgKey: data.Key,
    error,
  };
};

function ControlledLocation({ control, name, defaultValue, rules, ...props }) {
  const { field: { onChange, value } } = useController({ control, name, defaultValue, rules });

  const { ref: materialRef } = usePlacesWidget({
    apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
    onPlaceSelected: (place) => onChange(place.formatted_address),
    options: {
      types: [],
      fields: [
        "formatted_address",
      ],
      componentRestrictions: { country: 'tt' },
    },
  });

  return (
    <TextField
      {...props}
      inputRef={materialRef}
      onChange={onChange}
      name={name}
      id="outlined-venue"
      label="Location"
      variant="outlined"
      value={value}
    />
  )
};

export default function EventForm({ event = {}, onSave }) {
  const [ pricingDialogOpen, setPricingDialogOpen ] = useState(false);
  const [ updatingStatus, setUpdatingStatus ] = useState(null);
  const [ saving, setSaving ] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    unregister,
    formState,
    getValues,
    watch,
  } = useForm({
    mode: 'onBlur',
    defaultValues: { ...event },
  });

  useEffect(() => {
    if (event.updated_on !== getValues('updated_on')) {
      reset(event);
    }
  }, [ event, getValues, reset ]);

  const { isValid, isDirty, isSubmitting } = formState;

  const submitDisabled = saving || !isValid || !isDirty || isSubmitting;

  const onSubmit = async (data) => {
    setSaving(true);
    if (data.logo !== event.logo) {
      setUpdatingStatus({ type: 'info', message: 'Uploading Logo' });
      
      const logoBucket = 'event-logos';

      const { imgKey, error } = await replaceStorageImg(data.logo, logoBucket, event.uuid, event.logo);

      if (error) {
        setUpdatingStatus({ type: 'error', message: `Logo Upload: ${error.message}` });
        setSaving(false);
        return;
      }

      data.logo = {
        key: imgKey.replace(`${logoBucket}/`, ''),
        bucket: logoBucket,
      };

      setUpdatingStatus({ type: 'info', message: 'Uploaded Logo' });
    } else {
      delete data.logo;
    }
    
    if (data.ticket_template !== event.ticket_template) {
      setUpdatingStatus({ type: 'info', message: 'Uploading Ticket Template' });

      const ticketBucket = 'event-ticket-templates';

      const { imgKey, error } = await replaceStorageImg(data.ticket_template, ticketBucket, event.uuid, event.ticket_template);

      if (error) {
        setUpdatingStatus({ type: 'error', message: `Ticket Upload: ${error.message}` });
        setSaving(false);
        return;
      }
  
      data.ticket_template = {
        key: imgKey.replace(`${ticketBucket}/`, ''),
        bucket: ticketBucket,
        config: data.ticket_config,
      };
  
      setUpdatingStatus({ type: 'info', message: 'Uploaded Ticket Template' });
    } else if (!isEqual(data.ticket_config, event.ticket_config)) {
      data.ticket_template = {
        ...typeof data.ticket_template === 'object' && data.ticket_template,
        ...data.original_ticket_template || {},
        config: data.ticket_config,
      };
    } else {
      delete data.ticket_template;
    }

    delete data.original_ticket_template;
    delete data.ticket_config;

    setUpdatingStatus({ type: 'info', message: 'Updating Event' });

    const { data: newEvent, error } = await supabase.from('events')
      .update({
        ...data,
        updated_on: moment().toISOString(),
      }).eq('uuid', event.uuid).single();

    if (error) {
      setUpdatingStatus({ type: 'error', message: error.message });
    } else {
      setUpdatingStatus({ type: 'success', message: 'Event Updated' });
      console.log('newEvent', { ...newEvent })
      onSave(newEvent);
    }
    setSaving(false);
  };

  const onReset = () => {
    reset(event); 
  };

  return (
    <Container maxWidth="md" sx={{ marginBottom: '2rem' }}>
      <Alert onClose={() => setUpdatingStatus(null)} sx={{ visibility: updatingStatus ? 'visible' : 'hidden' }} severity={updatingStatus?.type}>{updatingStatus?.message}</Alert>
      <form
        onKeyDown={preventEnterSubmit}
        onSubmit={handleSubmit(onSubmit)}
        onReset={onReset}
      >
        <Stack direction="column" spacing={2}>
          <Typography variant="h6">
            Event Information
          </Typography>
          <div style={{ alignSelf: 'center' }}>
            <Typography component='label' htmlFor="logo" variant="subtitle1" >Event Logo:</Typography>
            <Controller
              control={control}
              name="logo"
              render={({ field }) => (
                <ImgUpload
                  {...field}
                  avatar
                  onUpload={field.onChange}
                />
              )}
            />
          </div>
          <Controller
            control={control}
            name="host"
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-host"
                label="Host"
                variant="outlined"
              />
            )}
          />
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-name"
                label="Name"
                variant="outlined"
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-description"
                label="Description"
                multiline
                minRows={5}
                variant="outlined"
              />
            )}
          />
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    disablePast
                    inputFormat="YYYY-MM-DD hh:mm"
                    label="Start Date"
                    InputLabelProps={{ shrink: true }}
                    openTo="month"
                    views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="yyyy-mm-dd hh:mm"
                      />
                    )}
                  />
                </LocalizationProvider>
              )}
            />
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    disablePast
                    inputFormat="YYYY-MM-DD hh:mm"
                    label="End Date"
                    InputLabelProps={{ shrink: true }}
                    openTo="month"
                    views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="yyyy-mm-dd hh:mm"
                      />
                    )}
                  />
                </LocalizationProvider>
              )}
            />
          </Stack>
          <ControlledLocation
            control={control}
            name="venue"
            placeholder="Search Google Maps"
            defaultValue={event.venue}
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="h6">
            Ticket Information
          </Typography>
          <div style={{ alignSelf: 'center' }}>
            <Typography component='label' htmlFor="ticket_template" variant="subtitle1" >Event Ticket:</Typography>
            <Controller
              control={control}
              name="ticket_template"
              render={({ field }) => (
                <div style={{ position: 'relative' }}>
                  <ImgUpload
                    {...field}
                    onUpload={field.onChange}
                  />
                  { field.value ? (
                      <>
                        <div style={{ width: 530, height: 204, position: 'absolute', top: 0, left: 0 }}>
                          <Controller
                            control={control}
                            name="ticket_config.position"
                            render={({ field }) => (
                              <div style={{ width: 530, height: 204, position: 'absolute', top: 0, left: 0 }}>
                                <ResizableQrCode
                                  {...field}
                                  config={field.value}
                                  lightColour={getValues('ticket_config.colour.light')?.hex}
                                  darkColour={getValues('ticket_config.colour.dark')?.hex}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <Typography component='label' htmlFor="qrcode-colour" variant="subtitle1" >QRCode Colour:</Typography>
                        <Stack id="qrcode-colour" direction="row" spacing={1}>
                          <Controller
                            control={control}
                            name="ticket_config.colour.light"
                            render={({ field }) => (
                              <ColorPicker
                                width={260}
                                height={204}
                                color={field.value || toColor('hex', '#fff')}
                                onChange={(e) => {
                                  field.onChange(e);
                                }}
                                alpha
                                hideHSV
                                hideRGB
                              />
                            )}
                          />
                          <Controller
                            control={control}
                            name="ticket_config.colour.dark"
                            render={({ field }) => (
                              <ColorPicker
                                width={260}
                                height={204}
                                color={field.value || toColor('hex', '#000')}
                                onChange={(e) => {
                                  field.onChange(e);
                                }}
                                alpha
                                hideHSV
                                hideRGB
                              />
                            )}
                          />
                        </Stack>
                      </>
                    ) : null
                  }
                </div>
              )}
            />
          </div>
          <Controller
            control={control}
            name="payment_config"
            defaultValue={{}}
            render={({ field }) => (
              <PricingDialog
                {...field}
                control={control}
                open={pricingDialogOpen}
                unregister={unregister}
                onClose={() => setPricingDialogOpen(false)}
              />
            )}
          />
          <Button
            fullWidth
            variant="contained"
            type="button"
            onClick={() => setPricingDialogOpen(true)}
          >
            Configure Pricing
          </Button>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Button disabled={submitDisabled} fullWidth variant="contained" type="submit">Submit</Button>
            <Button disabled={saving} fullWidth variant="outlined" type="reset">Reset</Button>
          </Stack>
        </Stack>
      </form>
    </Container>
  );
}
