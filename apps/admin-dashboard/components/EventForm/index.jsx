import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import { Controller, useController, useForm } from 'react-hook-form';
import { decode } from 'base64-arraybuffer';
import { ColorPicker, toColor } from 'react-color-palette';
import { usePlacesWidget } from 'react-google-autocomplete';
import { v4 } from 'uuid';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import startCase from 'lodash/startCase';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
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

import defaultEvent from './defaultEvent';
import PricingDialog from './PricingDialog';
import ImgUpload from '../ImgUpload';
import ResizableQrCode from '../ResizableImage';
import ResizableNumber from '../ResizableImage';
import RegistrationFormFieldsDialog from './RegistrationFormFieldsDialog';
import CONSTANTS from '../../lib/state/constants';
import useCan from '../../lib/hooks/useCan';

const {
  RBAC: {
    ACTIONS,
    SUBJECTS,
  },
} = CONSTANTS;

const MAX_TICKET_WIDTH = 1650;
const MAX_TICKET_HEIGHT = 650;
const TICKET_IMAGE_WIDTH = 660;
const TICKET_IMAGE_HEIGHT = 260;
const QR_CODE_SCALE = MAX_TICKET_WIDTH / TICKET_IMAGE_WIDTH;

const MAX_BANNER_WIDTH = 1600;
const MAX_BANNER_HEIGHT = 400;
const BANNER_IMAGE_WIDTH = 640;
const BANNER_IMAGE_HEIGHT = 160;

function preventEnterSubmit(e) {
  if (e.target.id === 'outlined-description') {
    return;
  }
  if (e.code.toLowerCase() === 'enter') {
    e.preventDefault();
  }
};

function ControlledLocation({ control, name, defaultValue, rules, ...props }) {
  const addressName = `${name}.address`;
  const placeIdName = `${name}.place_id`;
  const geocodeName = `${name}.geocode`;
  const {
    field: {
      onChange: onAddressChange,
      value: addressValue
    }
  } = useController({
    control,
    name: addressName,
    defaultValue: defaultValue?.address,
    rules
  });

  const {
    field: {
      onChange: onPlaceIdChange,
      value: placeIdValue
    }
  } = useController({
    control,
    name: placeIdName,
    defaultValue: defaultValue?.place_id,
    rules
  });

  const {
    field: {
      onChange: onGeocodeChange,
      value: geocodeValue
    }
  } = useController({
    control,
    name: geocodeName,
    defaultValue: defaultValue?.geocode,
    rules
  });

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
        'formatted_address',
        'place_id',
        'geometry'
      ],
      componentRestrictions: { country: 'tt' }
    }
  });

  return (
    <>
      <TextField
        {...props}
        id="outlined-venue-address"
        inputRef={materialRef}
        label="Address"
        name={addressName}
        onChange={onAddressChange}
        value={addressValue}
        variant="outlined"
      />
      <TextField
        {...props}
        id="outlined-venue-placeId"
        label="Place id"
        name={placeIdName}
        style={{
          display: 'none'
        }}
        value={placeIdValue}
        variant="outlined"
      />
      <TextField
        {...props}
        id="outlined-venue-geocode"
        label="Geocode"
        name={geocodeName}
        style={{
          display: 'none'
        }}
        value={geocodeValue}
        variant="outlined"
      />
    </>
  );
};

ControlledLocation.propTypes = {
  control: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.any,
  rules: PropTypes.object.isRequired
};

ControlledLocation.defaultProps = {
  defaultValue: {}
};

function ControlledColourPicker({ control, name, defaultValue, rules, ...props }) {
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
      height={TICKET_IMAGE_HEIGHT}
      hideHSV
      hideRGB
      width={TICKET_IMAGE_WIDTH}
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

ControlledColourPicker.propTypes = {
  control: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.any,
  rules: PropTypes.object
};

ControlledColourPicker.defaultProps = {
  defaultValue: toColor('hex', '#000'),
  rules: {}
};

export default function EventForm({ event, onSave, isNew }) {
  const { cannot } = useCan();
  const supabase = useSupabaseClient();

  const { enqueueSnackbar } = useSnackbar();

  const isSmallScreen = useMediaQuery('(max-width:780px)');
  const confirm = useConfirm();

  const [ eTickets, setETickets ] = useState(!isEmpty(event.ticket_template));
  const [ bannerImageWidth, setBannerImageWidth ] = useState(0);
  const [ bannerImageHeight, setBannerImageHeight ] = useState(BANNER_IMAGE_HEIGHT);
  const [ ticketImageWidth, setTicketImageWidth ] = useState(0);
  const [ ticketImageHeight, setTicketImageHeight ] = useState(TICKET_IMAGE_HEIGHT);
  const [ qrCodeScale, setQrCodeScale ] = useState(QR_CODE_SCALE);

  const [ pricingDialogOpen, setPricingDialogOpen ] = useState(false);
  const [ registrationFormFieldsDialogOpen, setRegistrationFormFieldsDialogOpen ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ eventPublished, setEventPublished ] = useState(event.is_published);

  const {
    control,
    handleSubmit,
    reset,
    unregister,
    formState,
    getValues,
    watch
  } = useForm({
    mode: 'onChange',
    defaultValues: { ...event }
  });

  useEffect(() => {
    if (event.updated_on !== getValues('updated_on')) {
      reset(event);
    }

    setEventPublished(event.is_published);
    setETickets(!isEmpty(event.ticket_template))
  }, [ event, getValues, reset, setEventPublished ]);

  useEffect(() => {
    if (isSmallScreen) {
      const newBannerWidth = BANNER_IMAGE_WIDTH / 2.15;
      const newBannerHeight = BANNER_IMAGE_HEIGHT / 2.15;
      const newTicketWidth = TICKET_IMAGE_WIDTH / 2.5;
      const newTicketHeight = TICKET_IMAGE_HEIGHT / 2.5;
      const newQrCodeScale = MAX_TICKET_WIDTH / newTicketWidth;

      setBannerImageWidth(newBannerWidth);
      setBannerImageHeight(newBannerHeight);
      setTicketImageWidth(newTicketWidth);
      setTicketImageHeight(newTicketHeight);
      setQrCodeScale(newQrCodeScale);
    } else {
      setBannerImageWidth(BANNER_IMAGE_WIDTH);
      setBannerImageHeight(BANNER_IMAGE_HEIGHT);
      setTicketImageWidth(TICKET_IMAGE_WIDTH);
      setTicketImageHeight(TICKET_IMAGE_HEIGHT);
      setQrCodeScale(QR_CODE_SCALE);
    }
  }, [ isSmallScreen ]);

  const lightColourValue = useCallback((ageLabel) =>
    watch(`ticket_config.${ageLabel}.colour.light`)?.hex
  , [ watch ]);

  const darkColourValue = useCallback((ageLabel) =>
    watch(`ticket_config.${ageLabel}.colour.dark`)?.hex
  , [ watch ]);

  const { isValid, isDirty, isSubmitting } = formState;

  const submitDisabled = cannot(ACTIONS.EDIT, SUBJECTS.EVENTS) || eventPublished || saving || !isValid || !isDirty || isSubmitting;

  const requiredRules = {
    required: 'Required'
  };

  async function replaceStorageImg(b64ImgData, bucket, eventUuid, oldPath, pathBeforeUuid = '') {
    const contentType = b64ImgData.split(';')[0].replace('data:', '');
    const extension = contentType.split('/')[1];
    const imgArrayBuffer = decode(b64ImgData.split(',')[1]);
  
    const { data, error } = await supabase.storage.from(bucket)
      .upload(
        `${eventUuid}/${pathBeforeUuid}${v4()}.${extension}`,
        imgArrayBuffer,
        { contentType, upsert: true }
      );
  
    if (!error) {
      // Remove old img
      if (oldPath) {
        const oldFileName = oldPath.split(`${bucket}/`).pop();
  
        if (oldFileName) {
          await supabase.storage.from(bucket).remove(oldFileName);
        }
      }
    }
  
    return {
      imgKey: data?.path,
      error
    };
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
          color: 'error'
        },
        cancellationButtonProps: {
          variant: 'outlined'
        }
      });

      enqueueSnackbar('Publishing Event', {
        variant: 'info'
      });

      const { data: publishedEvent, error } = await supabase.from('events')
        .update({
          is_published: true,
          updated_on: moment().toISOString()
        }).eq('uuid', event.uuid).select().single();

      if (error) {
        enqueueSnackbar(`Failed to publish event: ${error.message}`, {
          variant: 'error'
        });
      } else {
        enqueueSnackbar('Event Published', {
          variant: 'success'
        });

        onSave(publishedEvent);
      }
    } catch (e) {
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
        variant: 'info'
      });

      const logoBucket = 'event-assets';

      const { imgKey, error } = await replaceStorageImg(
        data.logo,
        logoBucket,
        event.uuid,
        event.logo,
        'logo/'
      );

      if (error) {
        enqueueSnackbar(`Failed to upload Logo: ${error.message}`, {
          variant: 'error'
        });
        setSaving(false);
        return;
      }

      data.logo = {
        key: imgKey.replace(`${logoBucket}/`, ''),
        bucket: logoBucket
      };

      enqueueSnackbar('Uploaded Logo', {
        variant: 'success'
      });
    } else {
      delete data.logo;
    }

    if (data.banner !== event.banner) {
      enqueueSnackbar('Uploading Banner', {
        variant: 'info'
      });

      const bannerBucket = 'event-assets';

      const { imgKey, error } = await replaceStorageImg(
        data.banner,
        bannerBucket,
        event.uuid,
        event.banner,
        'banner/'
      );

      if (error) {
        enqueueSnackbar(`Failed to upload Banner: ${error.message}`, {
          variant: 'error'
        });
        setSaving(false);
        return;
      }

      data.banner = {
        key: imgKey.replace(`${bannerBucket}/`, ''),
        bucket: bannerBucket
      };

      enqueueSnackbar('Uploaded Banner', {
        variant: 'success'
      });
    } else {
      delete data.banner;
    }

    data.ticket_template = eTickets ? data.ticket_template : {};

    const ticketTemplateKeys = Object.keys(data.ticket_template || {});

    for (let i = 0; i < ticketTemplateKeys.length; i = i + 1) {
      const ageLabel = ticketTemplateKeys[i];

      const templateInfo = data.ticket_template[ageLabel];

      if (data.ticket_template[ageLabel] !== event.ticket_template[ageLabel]) {
        const displayAgeLabel = startCase(ageLabel);

        enqueueSnackbar(`Uploading Ticket Template for ${displayAgeLabel}`, {
          variant: 'info'
        });

        const ticketBucket = 'event-ticket-templates';

        const { imgKey, error } = await replaceStorageImg(
          templateInfo,
          ticketBucket,
          event.uuid,
          event.ticket_template[ageLabel]
        );

        if (error) {
          enqueueSnackbar(`Failed to upload Ticket for ${displayAgeLabel}: ${error.message}`, {
            variant: 'error'
          });
          setSaving(false);
          return;
        }

        data.ticket_template[ageLabel] = {
          key: imgKey.replace(`${ticketBucket}/`, ''),
          bucket: ticketBucket,
          config: data.ticket_config[ageLabel]
        };

        enqueueSnackbar(`Uploaded Ticket Template for ${displayAgeLabel}`, {
          variant: 'success'
        });
      } else if (!isEqual(data.ticket_config[ageLabel], event.ticket_config[ageLabel])) {
        data.ticket_template[ageLabel] = {
          ...typeof templateInfo === 'object' && templateInfo,
          ...data.original_ticket_template[ageLabel] || {},
          config: data.ticket_config[ageLabel]
        };
      }
    };

    await Promise.all(map(data.original_ticket_template, (originalTemplateInfo, ageLabel) => {
      if (eTickets) {
        if (typeof data.ticket_template[ageLabel] === 'string') {
          data.ticket_template[ageLabel] = originalTemplateInfo;
        }
  
        if (!data.payment_config?.age_mapping[ageLabel]) {
          delete data.ticket_template[ageLabel];
  
          return supabase.storage.from(originalTemplateInfo.bucket).remove(originalTemplateInfo.key);
        }
        
        return Promise.resolve();
      } else {
        return supabase.storage.from(originalTemplateInfo.bucket).remove(originalTemplateInfo.key);
      }
    }));


    delete data.original_ticket_template;
    delete data.ticket_config;

    enqueueSnackbar(`${isNew ? 'Creating' : 'Updating'} Event`, {
      variant: 'info'
    });

    const { data: newEvent, error } = await supabase.from('events')
      [isNew ? 'insert' : 'update']({
        ...data,
        updated_on: moment().toISOString()
      }).eq('uuid', event.uuid).select().single();

    if (error) {
      enqueueSnackbar(error.message, {
        variant: 'error'
      });
    } else {
      enqueueSnackbar(`Event ${isNew ? 'Created' : 'Updated'}`, {
        variant: 'success'
      });

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
        onReset={onReset}
        onSubmit={handleSubmit(onSubmit)}
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
              render={({ field }) =>
                <ImgUpload
                  {...field}
                  altText="Event Logo"
                  avatar
                  disabled={eventPublished}
                  height={120}
                  maxHeight={500}
                  maxWidth={500}
                  onUpload={field.onChange}
                  width={120}
                />
              }
              rules={requiredRules}
            />
          </div>
          <div style={{ alignSelf: 'center' }}>
            <Typography component='label' htmlFor="banner" variant="subtitle1" >Event Banner:</Typography>
            <Controller
              control={control}
              name="banner"
              render={({ field }) =>
                <ImgUpload
                  {...field}
                  altText="Event Banner"
                  disabled={eventPublished}
                  height={bannerImageHeight}
                  maxHeight={MAX_BANNER_HEIGHT}
                  maxWidth={MAX_BANNER_WIDTH}
                  onUpload={field.onChange}
                  sizeText={'4" x 1"'}
                  width={bannerImageWidth}
                />
              }
              rules={requiredRules}
            />
          </div>
          <Controller
            control={control}
            name="host"
            render={({ field }) =>
              <TextField
                {...field}
                disabled={eventPublished}
                id="outlined-host"
                label="Host"
                variant="outlined"
              />
            }
            rules={requiredRules}
          />
          <Controller
            control={control}
            name="name"
            render={({ field }) =>
              <TextField
                {...field}
                disabled={eventPublished}
                id="outlined-name"
                label="Name"
                variant="outlined"
              />
            }
            rules={requiredRules}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) =>
              <TextField
                {...field}
                disabled={eventPublished}
                id="outlined-description"
                label="Description"
                minRows={5}
                multiline
                variant="outlined"
              />
            }
          />
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) =>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    InputLabelProps={{ shrink: true }}
                    disablePast
                    disabled={eventPublished}
                    inputFormat="YYYY-MM-DD hh:mm A"
                    label="Start Date"
                    openTo="month"
                    renderInput={(params) =>
                      <TextField
                        {...params}
                        fullWidth
                        helperText="yyyy-mm-dd hh:mm"
                      />
                    }
                    views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                  />
                </LocalizationProvider>
              }
              rules={requiredRules}
            />
            <Controller
              control={control}
              name="end_date"
              render={({ field }) =>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    InputLabelProps={{ shrink: true }}
                    disablePast
                    disabled={eventPublished}
                    inputFormat="YYYY-MM-DD hh:mm A"
                    label="End Date"
                    openTo="month"
                    renderInput={(params) =>
                      <TextField
                        {...params}
                        fullWidth
                        helperText="yyyy-mm-dd hh:mm"
                      />
                    }
                    views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                  />
                </LocalizationProvider>
              }
              rules={requiredRules}
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Controller
              control={control}
              name="register_by_date"
              render={({ field }) =>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    InputLabelProps={{ shrink: true }}
                    disablePast
                    disabled={eventPublished}
                    inputFormat="YYYY-MM-DD hh:mm A"
                    label="Registration End Date"
                    openTo="month"
                    renderInput={(params) =>
                      <TextField
                        {...params}
                        fullWidth
                        helperText="yyyy-mm-dd hh:mm"
                      />
                    }
                    views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                  />
                </LocalizationProvider>
              }
              rules={requiredRules}
            />
            <Controller
              control={control}
              name="doors_open_by_date"
              render={({ field }) =>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    {...field}
                    InputLabelProps={{ shrink: true }}
                    disablePast
                    disabled={eventPublished}
                    inputFormat="YYYY-MM-DD hh:mm A"
                    label="Doors Open By"
                    openTo="month"
                    renderInput={(params) =>
                      <TextField
                        {...params}
                        fullWidth
                        helperText="yyyy-mm-dd hh:mm"
                      />
                    }
                    views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                  />
                </LocalizationProvider>
              }
              rules={requiredRules}
            />
          </Stack>
          <ControlledLocation
            InputLabelProps={{ shrink: true }}
            control={control}
            defaultValue={event.venue}
            disabled={eventPublished}
            name="venue"
            placeholder="Search Google Maps"
            rules={requiredRules}
          />
          <Typography variant="h6">
            Ticket Information
          </Typography>
          <Controller
            control={control}
            defaultValue={{}}
            name="payment_config"
            render={({ field }) =>
              <PricingDialog
                {...field}
                disabled={eventPublished}
                onClose={() => setPricingDialogOpen(false)}
                open={pricingDialogOpen}
                unregister={unregister}
              />
            }
          />
          <Button
            fullWidth
            onClick={() => setPricingDialogOpen(true)}
            type="button"
            variant="contained"
          >
            Click to Configure Pricing
          </Button>
          <FormControlLabel
            control={<Switch />}
            label="E-Tickets"
            labelPlacement="start"
            onChange={({ target }) => setETickets(target.checked)}
            sx={{ alignSelf: "center" }}
            checked={eTickets}
          />
          {
            eTickets ? (
              map(getValues('payment_config.age_mapping'), (_, ageLabel) =>
                <Accordion key={ageLabel}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Ticket for: {startCase(ageLabel)}</Typography>
                  </AccordionSummary>
                  <AccordionDetails draggable="false">
                    <Stack justifyContent="center" position="relative" width="100%">
                      <Typography
                        component='label'
                        htmlFor="ticket_template"
                        variant="subtitle1"
                      >
                        Event Ticket:
                      </Typography>
                      <Controller
                        control={control}
                        name={`ticket_template.${ageLabel}`}
                        render={({ field }) =>
                          <ImgUpload
                            {...field}
                            altText={`${startCase(ageLabel)} Ticket`}
                            disabled={eventPublished}
                            height={ticketImageHeight}
                            maxHeight={MAX_TICKET_HEIGHT}
                            maxWidth={MAX_TICKET_WIDTH}
                            onUpload={field.onChange}
                            width={ticketImageWidth}
                          >
                            <>
                              <Controller
                                control={control}
                                name={`ticket_config.${ageLabel}.position.qrcode`}
                                render={({ field: qrcodeField }) =>
                                  <div
                                    style={{
                                      width: ticketImageWidth,
                                      height: ticketImageHeight,
                                      position: 'absolute',
                                      top: 0,
                                      alignSelf: 'center'
                                    }}
                                  >
                                    <ResizableQrCode
                                      {...qrcodeField}
                                      config={qrcodeField.value}
                                      darkColour={darkColourValue(ageLabel)}
                                      disabled={eventPublished}
                                      lightColour={lightColourValue(ageLabel)}
                                      maxHeight={ticketImageHeight}
                                      scale={qrCodeScale}
                                    />
                                  </div>
                                }
                              />
                              <Controller
                                control={control}
                                name={`ticket_config.${ageLabel}.position.number`}
                                render={({ field: numberField }) =>
                                  <div
                                    style={{
                                      width: ticketImageWidth,
                                      height: ticketImageHeight,
                                      position: 'absolute',
                                      top: 0,
                                      alignSelf: 'center',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <ResizableNumber
                                      {...numberField}
                                      config={numberField.value}
                                      darkColour={darkColourValue(ageLabel)}
                                      disabled={eventPublished}
                                      lightColour={lightColourValue(ageLabel)}
                                      maxHeight={ticketImageHeight}
                                      maxWidth={ticketImageWidth}
                                      scale={qrCodeScale}
                                      type="number"
                                    />
                                  </div>
                                }
                              />
                            </>
                          </ImgUpload>
                        }
                        rules={requiredRules}
                      />
                      {
                        !eventPublished &&
                          <>
                            <Typography
                              component='label'
                              htmlFor={`qrcode-colour-${ageLabel}`}
                              variant="subtitle1"
                            >
                              QRCode Colour:
                            </Typography>
                            <Stack
                              direction="row"
                              id={`qrcode-colour-${ageLabel}`}
                              justifyContent="center"
                              spacing={1}
                            >
                              <ControlledColourPicker
                                control={control}
                                height={ticketImageHeight}
                                name={`ticket_config.${ageLabel}.colour.light`}
                                width={ticketImageWidth / 2 - 5}
                              />
                              <ControlledColourPicker
                                control={control}
                                height={ticketImageHeight}
                                name={`ticket_config.${ageLabel}.colour.dark`}
                                width={ticketImageWidth / 2 - 5}
                              />
                            </Stack>
                          </>
  
                      }
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )
            ) : null
          }
          <Typography variant="h6">
            Registration / Email Information
          </Typography>
          <Controller
            control={control}
            defaultValue={{}}
            name="registration_form_fields"
            render={({ field }) =>
              <RegistrationFormFieldsDialog
                {...field}
                disabled={eventPublished}
                onClose={() => setRegistrationFormFieldsDialogOpen(false)}
                open={registrationFormFieldsDialogOpen}
                unregister={unregister}
              />
            }
          />
          <Button
            fullWidth
            onClick={() => setRegistrationFormFieldsDialogOpen(true)}
            type="button"
            variant="contained"
          >
            Click to configure the Registration Form
          </Button>
          <Stack alignItems="center" justifyContent="center">
            <Typography
              component='label'
              htmlFor="branding.primary_colour"
              variant="subtitle1"
            >
              Primary Branding Colour:
            </Typography>
            <ControlledColourPicker
              control={control}
              height={ticketImageHeight}
              name="branding.primary_colour"
              width={ticketImageWidth}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Button
              disabled={submitDisabled}
              fullWidth
              type="submit"
              variant="contained"
            >
              {isNew ? 'Create' : 'Save'}
            </Button>
            <Button disabled={saving} fullWidth type="reset" variant="outlined">Reset</Button>
          </Stack>
          {
            !isNew &&
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Button
                  disabled={cannot(ACTIONS.PUBLISH, SUBJECTS.EVENTS) || eventPublished || saving || !isValid}
                  fullWidth
                  onClick={handleOnPublish}
                  sx={{ mr: 1 }}
                  type="button"
                  variant="contained"
                >
                  Publish Event
                </Button>
                <Button
                  // TODO: Setup the ability to delete an event
                  color="error"
                  // disabled={cannot(ACTIONS.MANAGE, SUBJECTS.EVENTS) || (eventPublished || saving)}
                  disabled
                  fullWidth
                  onClick={handleOnDelete}
                  type="button"
                  variant="contained"
                >
                  Delete Event
                </Button>
              </Stack>

          }
        </Stack>
      </form>
    </Container>
  );
};

EventForm.propTypes = {
  event: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  isNew: PropTypes.bool
};

EventForm.defaultProps = {
  event: defaultEvent,
  isNew: false
};
