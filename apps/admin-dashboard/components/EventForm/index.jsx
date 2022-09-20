import React, { useEffect, useState } from 'react'
import { Controller, useController, useForm } from 'react-hook-form';
import { decode } from 'base64-arraybuffer';
import { ColorPicker, toColor } from "react-color-palette";
import { usePlacesWidget } from "react-google-autocomplete";
import { v4 } from 'uuid';
import moment from 'moment';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import startCase from 'lodash/startCase';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import PricingDialog from './PricingDialog';
import ImgUpload from '../ImgUpload';
import supabase from '../../lib/supabase';
import ResizableQrCode from '../ResizableQrCode';

const MAX_TICKET_WIDTH = 1650;
const MAX_TICKET_HEIGHT = 650;
const TICKET_IMAGE_WIDTH = 660;
const TICKET_IMAGE_HEIGHT = 260;
const QR_CODE_SCALE = MAX_TICKET_WIDTH / TICKET_IMAGE_WIDTH;

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

export default function EventForm({ event = {
  ticket_template: {},
  ticket_config: {},
  original_ticket_template: {},
}, onSave }) {
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

    for (let ageLabel in data.ticket_template || {}) {
      const templateInfo = data.ticket_template[ageLabel];

      if (data.ticket_template[ageLabel] !== event.ticket_template[ageLabel]) {
        const displayAgeLabel = startCase(ageLabel);

        setUpdatingStatus({ type: 'info', message: `Uploading Ticket Template for ${displayAgeLabel}` });
  
        const ticketBucket = 'event-ticket-templates';
  
        const { imgKey, error } = await replaceStorageImg(templateInfo, ticketBucket, event.uuid, event.ticket_template[ageLabel]);
  
        if (error) {
          setUpdatingStatus({ type: 'error', message: `Ticket Upload for ${displayAgeLabel}: ${error.message}` });
          setSaving(false);
          return;
        }
    
        data.ticket_template[ageLabel] = {
          key: imgKey.replace(`${ticketBucket}/`, ''),
          bucket: ticketBucket,
          config: data.ticket_config[ageLabel],
        };
    
        setUpdatingStatus({ type: 'info', message: `Uploaded Ticket Template for ${displayAgeLabel}` });
      } else if (!isEqual(data.ticket_config[ageLabel], event.ticket_config[ageLabel])) {
        data.ticket_template[ageLabel] = {
          ...typeof templateInfo === 'object' && templateInfo,
          ...data.original_ticket_template[ageLabel] || {},
          config: data.ticket_config[ageLabel],
        };
      }
    };

    await Promise.all(map(data.original_ticket_template, (originalTemplateInfo, ageLabel) => {
      if (typeof data.ticket_template[ageLabel] === 'string') {
        data.ticket_template[ageLabel] = originalTemplateInfo;
      }

      if (!data.payment_config?.age_mapping[ageLabel]) {
        delete data.ticket_template[ageLabel];

        return supabase.storage.from(originalTemplateInfo.bucket).remove(originalTemplateInfo.key);
      }

      return Promise.resolve();
    }));
    

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
                  altText="Event Logo"
                  onUpload={field.onChange}
                  width={120}
                  height={120}
                  maxWidth={500}
                  maxHeight={500}
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
          <Controller
            control={control}
            name="payment_config"
            defaultValue={{}}
            render={({ field }) => (
              <PricingDialog
                {...field}
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
          {
            map(getValues('payment_config.age_mapping'), (_, ageLabel) => (
              <Accordion key={ageLabel}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Ticket for: {startCase(ageLabel)}</Typography>
                </AccordionSummary>
                <AccordionDetails draggable="false">
                  <Stack position="relative" justifyContent="center" width="100%">
                    <Typography component='label' htmlFor="ticket_template" variant="subtitle1" >Event Ticket:</Typography>
                    <Controller
                      control={control}
                      name={`ticket_template.${ageLabel}`}
                      render={({ field }) => (
                          <ImgUpload
                            {...field}
                            onUpload={field.onChange}
                            width={TICKET_IMAGE_WIDTH}
                            height={TICKET_IMAGE_HEIGHT}
                            maxWidth={MAX_TICKET_WIDTH}
                            maxHeight={MAX_TICKET_HEIGHT}
                            altText={`${startCase(ageLabel)} Ticket`}
                          >
                            <Controller
                              control={control}
                              name={`ticket_config.${ageLabel}.position`}
                              render={({ field }) => (
                                <div style={{ width: TICKET_IMAGE_WIDTH, height: TICKET_IMAGE_HEIGHT, position: 'absolute', top: 0, alignSelf: 'center' }}>
                                  <ResizableQrCode
                                    {...field}
                                    scale={QR_CODE_SCALE}
                                    maxHeight={TICKET_IMAGE_HEIGHT}
                                    config={field.value}
                                    lightColour={watch(`ticket_config.${ageLabel}.colour.light`)?.hex}
                                    darkColour={watch(`ticket_config.${ageLabel}.colour.dark`)?.hex}
                                  />
                                </div>
                              )}
                            />
                          </ImgUpload>
                      )}
                    />
                    <Typography component='label' htmlFor={`qrcode-colour-${ageLabel}`} variant="subtitle1" >QRCode Colour:</Typography>
                    <Stack id={`qrcode-colour-${ageLabel}`} direction="row" justifyContent="center" spacing={1}>
                      <Controller
                        control={control}
                        name={`ticket_config.${ageLabel}.colour.light`}
                        render={({ field }) => (
                          <ColorPicker
                            width={(TICKET_IMAGE_WIDTH / 2) - 5}
                            height={TICKET_IMAGE_HEIGHT}
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
                        name={`ticket_config.${ageLabel}.colour.dark`}
                        render={({ field }) => (
                          <ColorPicker
                            width={(TICKET_IMAGE_WIDTH / 2) - 5}
                            height={TICKET_IMAGE_HEIGHT}
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
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))
          }
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Button disabled={submitDisabled} fullWidth variant="contained" type="submit">Submit</Button>
            <Button disabled={saving} fullWidth variant="outlined" type="reset">Reset</Button>
          </Stack>
        </Stack>
      </form>
    </Container>
  );
}
