import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMediaQuery from '@mui/material/useMediaQuery';
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

function ControlledLocation({ control, name, defaultValue = {}, rules, ...props }) {
  const addressName = `${name}.address`;
  const placeIdName = `${name}.place_id`;
  const geocodeName = `${name}.geocode`;
  const { field: { onChange: onAddressChange, value: addressValue } } = useController({ control, name: addressName, defaultValue: defaultValue?.address, rules });
  const { field: { onChange: onPlaceIdChange, value: placeIdValue } } = useController({ control, name: placeIdName, defaultValue: defaultValue?.place_id, rules });
  const { field: { onChange: onGeocodeChange, value: geocodeValue } } = useController({ control, name: geocodeName, defaultValue: defaultValue?.geocode, rules });

  const { ref: materialRef } = usePlacesWidget({
    apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      const geocodeString = `${place.geometry.location.lat()},${place.geometry.location.lng()}`;
      onGeocodeChange(geocodeString);
      onAddressChange(place.formatted_address);
      onPlaceIdChange(place.place_id);
    },
    options: {
      types: [],
      fields: [
        "formatted_address",
        "place_id",
        "geometry",
      ],
      componentRestrictions: { country: 'tt' },
    },
  });

  return (
    <>
      <TextField
        {...props}
        inputRef={materialRef}
        onChange={onAddressChange}
        name={addressName}
        id="outlined-venue-address"
        label="Address"
        variant="outlined"
        value={addressValue}
      />
      <TextField
        {...props}
        name={placeIdName}
        id="outlined-venue-placeId"
        label="Place id"
        variant="outlined"
        value={placeIdValue}
        style={{
          display: 'none',
        }}
      />
      <TextField
        {...props}
        name={geocodeName}
        id="outlined-venue-geocode"
        label="Geocode"
        variant="outlined"
        value={geocodeValue}
        style={{
          display: 'none',
        }}
      />
    </>
  )
};

function ControlledColourPicker({ control, name, defaultValue = toColor('hex', '#000'), rules, ...props }) {
  const { field: { onChange, value } } = useController({ control, name, defaultValue, rules });
  
  const [ internalValue, setInternalValue ] = useState(value || defaultValue);

  const colourChangeRef = useRef(null);

  const changeControlledValue = (val) => {
    colourChangeRef.current = setTimeout(() => {
      // Attempt to update the value after 150ms
      // but cancel it on every change event.
      // This is an attempt to only update it after
      // the user is done changing the value
      onChange(val);
    }, 150);
  };

  // To handle reset since colour doesn't update
  // on state change due to reset
  useEffect(() => {
    if (internalValue.hex !== value?.hex) {
      setInternalValue(value);
    }
  }, [ value ]);

  return (
    <ColorPicker
      alpha
      hideHSV
      hideRGB
      width={TICKET_IMAGE_WIDTH}
      height={TICKET_IMAGE_HEIGHT}
      {...props}
      color={internalValue}
      // Can't use until the fix for the inputs to call onChangeComplete
      // onChangeComplete={onChange}
      onChange={(e) => {
        clearTimeout(colourChangeRef.current);
        changeControlledValue(e);
        setInternalValue(e);
      }}
    />
  );
};

export default function EventForm({ event = {
  uuid: v4(),
  ticket_template: {},
  ticket_config: {},
  original_ticket_template: {},
  is_published: false,
}, onSave }) {
  const { enqueueSnackbar } = useSnackbar();

  const isSmallScreen = useMediaQuery('(max-width:780px)');
  const confirm = useConfirm();

  const [ ticketImageWidth, setTicketImageWidth ] = useState(TICKET_IMAGE_WIDTH);
  const [ ticketImageHeight, setTicketImageHeight ] = useState(TICKET_IMAGE_HEIGHT);
  const [ qrCodeScale, setQrCodeScale ] = useState(QR_CODE_SCALE);

  const [ pricingDialogOpen, setPricingDialogOpen ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ eventPublished, setEventPublished ] = useState(event.is_published);

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
    reValidateMode: 'onChange',
    defaultValues: { ...event },
  });

  useEffect(() => {
    if (event.updated_on !== getValues('updated_on')) {
      reset(event);
    }

    setEventPublished(event.is_published);
  }, [ event, getValues, reset, setEventPublished ]);

  useEffect(() => {
    if (isSmallScreen) {
      const newWidth = TICKET_IMAGE_WIDTH / 2;
      const newHeight = TICKET_IMAGE_HEIGHT / 2;
      const newScale = MAX_TICKET_WIDTH / newWidth;

      setTicketImageWidth(newWidth);
      setTicketImageHeight(newHeight);
      setQrCodeScale(newScale);
    } else {
      setTicketImageWidth(TICKET_IMAGE_WIDTH);
      setTicketImageHeight(TICKET_IMAGE_HEIGHT);
      setQrCodeScale(QR_CODE_SCALE);
    }
  }, [ isSmallScreen ]);

  const lightColourValue = useCallback((ageLabel) => (
    watch(`ticket_config.${ageLabel}.colour.light`)?.hex
  ), [ watch ]);

  const darkColourValue = useCallback((ageLabel) => (
    watch(`ticket_config.${ageLabel}.colour.dark`)?.hex
  ), [ watch ]);

  const { isValid, isDirty, isSubmitting } = formState;

  const submitDisabled = eventPublished || saving || !isValid || !isDirty || isSubmitting;

  const requiredRules = {
    required: 'Required',
  };

  const handleOnPublish = async () => {
    setSaving(true);

    try {
      await confirm({
        title: 'Are you sure you wish to publish this event?',
        description: 'Published events can no longer be edited. All information here is considered final.',
        confirmationText: 'Publish',
        cancellationText: 'Cancel',
        allowClose: false,
        confirmationButtonProps: {
          variant: 'contained',
          color: 'error',
        },
        cancellationButtonProps: {
          variant: 'outlined',
        },
      });

      enqueueSnackbar('Publishing Event', {
        variant: 'info',
      });
  
      const { data: publishedEvent, error } = await supabase.from('events')
        .update({
          is_published: true,
          updated_on: moment().toISOString(),
        }).eq('uuid', event.uuid).single();
  
      if (error) {
        enqueueSnackbar(`Failed to publish event: ${error.message}`, {
          variant: 'error',
        });
      } else {
        enqueueSnackbar('Event Published', {
          variant: 'success',
        });
  
        onSave(publishedEvent);
      }
    } catch(e) {
      console.log('Publishing cancelled');
    }
    
    setSaving(false);
  };

  const handleOnDelete = async () => {
    console.log('Event Deleted');
    // const { data: publishedEvent, error } = await supabase.from('events')
  };

  const onSubmit = async (data) => {
    setSaving(true);
    if (data.logo !== event.logo) {
      enqueueSnackbar('Uploading Logo', {
        variant: 'info',
      });
      
      const logoBucket = 'event-logos';

      const { imgKey, error } = await replaceStorageImg(data.logo, logoBucket, event.uuid, event.logo);

      if (error) {
        enqueueSnackbar(`Failed to upload Logo: ${error.message}`, {
          variant: 'error',
        });
        setSaving(false);
        return;
      }

      data.logo = {
        key: imgKey.replace(`${logoBucket}/`, ''),
        bucket: logoBucket,
      };

      enqueueSnackbar('Uploaded Logo', {
        variant: 'success',
      });
    } else {
      delete data.logo;
    }

    for (let ageLabel in data.ticket_template || {}) {
      const templateInfo = data.ticket_template[ageLabel];

      if (data.ticket_template[ageLabel] !== event.ticket_template[ageLabel]) {
        const displayAgeLabel = startCase(ageLabel);

        enqueueSnackbar(`Uploading Ticket Template for ${displayAgeLabel}`, {
          variant: 'info',
        });
  
        const ticketBucket = 'event-ticket-templates';
  
        const { imgKey, error } = await replaceStorageImg(templateInfo, ticketBucket, event.uuid, event.ticket_template[ageLabel]);
  
        if (error) {
          enqueueSnackbar(`Failed to upload Ticket for ${displayAgeLabel}: ${error.message}`, {
            variant: 'error',
          });
          setSaving(false);
          return;
        }
    
        data.ticket_template[ageLabel] = {
          key: imgKey.replace(`${ticketBucket}/`, ''),
          bucket: ticketBucket,
          config: data.ticket_config[ageLabel],
        };
    
        enqueueSnackbar(`Uploaded Ticket Template for ${displayAgeLabel}`, {
          variant: 'success',
        });
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

    enqueueSnackbar('Updating Event', {
      variant: 'info',
    });

    const { data: newEvent, error } = await supabase.from('events')
      .update({
        ...data,
        updated_on: moment().toISOString(),
      }).eq('uuid', event.uuid).single();

    if (error) {
      enqueueSnackbar(error.message, {
        variant: 'error',
      });
    } else {
      enqueueSnackbar('Event Updated', {
        variant: 'success',
      });
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
                  disabled={eventPublished}
                />
              )}
              rules={requiredRules}
            />
          </div>
          <Controller
            control={control}
            name="host"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={eventPublished}
                id="outlined-host"
                label="Host"
                variant="outlined"
              />
            )}
            rules={requiredRules}
          />
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={eventPublished}
                id="outlined-name"
                label="Name"
                variant="outlined"
              />
            )}
            rules={requiredRules}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={eventPublished}
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
                    disabled={eventPublished}
                    disablePast
                    inputFormat="YYYY-MM-DD hh:mm A"
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
              rules={requiredRules}
            />
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    disabled={eventPublished}
                    disablePast
                    inputFormat="YYYY-MM-DD hh:mm A"
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
              rules={requiredRules}
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Controller
              control={control}
              name="register_by_date"
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    disabled={eventPublished}
                    disablePast
                    inputFormat="YYYY-MM-DD hh:mm A"
                    label="Registration End Date"
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
              rules={requiredRules}
            />
            <Controller
              control={control}
              name="doors_open_by_date"
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    disabled={eventPublished}
                    disablePast
                    inputFormat="YYYY-MM-DD hh:mm A"
                    label="Doors Open By"
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
              rules={requiredRules}
            />
          </Stack>
          <ControlledLocation
            control={control}
            disabled={eventPublished}
            name="venue"
            placeholder="Search Google Maps"
            defaultValue={event.venue}
            InputLabelProps={{ shrink: true }}
            rules={requiredRules}
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
                disabled={eventPublished}
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
                            disabled={eventPublished}
                            onUpload={field.onChange}
                            width={ticketImageWidth}
                            height={ticketImageHeight}
                            maxWidth={MAX_TICKET_WIDTH}
                            maxHeight={MAX_TICKET_HEIGHT}
                            altText={`${startCase(ageLabel)} Ticket`}
                          >
                            <Controller
                              control={control}
                              name={`ticket_config.${ageLabel}.position`}
                              render={({ field }) => (
                                <div style={{ width: ticketImageWidth, height: ticketImageHeight, position: 'absolute', top: 0, alignSelf: 'center' }}>
                                  <ResizableQrCode
                                    {...field}
                                    disabled={eventPublished}
                                    scale={qrCodeScale}
                                    maxHeight={ticketImageHeight}
                                    config={field.value}
                                    lightColour={lightColourValue(ageLabel)}
                                    darkColour={darkColourValue(ageLabel)}
                                  />
                                </div>
                              )}
                            />
                          </ImgUpload>
                      )}
                    />
                    {
                      !eventPublished && (
                        <>
                          <Typography component='label' htmlFor={`qrcode-colour-${ageLabel}`} variant="subtitle1" >QRCode Colour:</Typography>
                          <Stack id={`qrcode-colour-${ageLabel}`} direction="row" justifyContent="center" spacing={1}>
                            <ControlledColourPicker
                              control={control}
                              name={`ticket_config.${ageLabel}.colour.light`}
                              width={(ticketImageWidth / 2) - 5}
                              height={ticketImageHeight}
                            />
                            <ControlledColourPicker
                              control={control}
                              name={`ticket_config.${ageLabel}.colour.dark`}
                              width={(ticketImageWidth / 2) - 5}
                              height={ticketImageHeight}
                            />
                          </Stack>
                        </>
                      )
                    }
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))
          }
          <Typography variant="h6">
            Registration / Email Information
          </Typography>
          <Stack justifyContent="center" alignItems="center">
            <Typography component='label' htmlFor="branding.primary_colour" variant="subtitle1" >Primary Branding Colour:</Typography>
            <ControlledColourPicker
              control={control}
              name="branding.primary_colour"
              width={ticketImageWidth}
              height={ticketImageHeight}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Button disabled={submitDisabled} fullWidth variant="contained" type="submit">Save</Button>
            <Button disabled={saving} fullWidth variant="outlined" type="reset">Reset</Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Button
              sx={{ mr: 1 }}
              disabled={eventPublished || saving || !isValid}
              fullWidth
              onClick={handleOnPublish}
              variant="contained"
              type="button"
            >
              Publish Event
            </Button>
            <Button
              // TODO: Setup the ability to delete an event
              disabled
              // disabled={eventPublished || saving}
              fullWidth
              onClick={handleOnDelete}
              color="error"
              variant="contained"
              type="button"
            >
              Delete Event
            </Button>
          </Stack>
        </Stack>
      </form>
    </Container>
  );
}
