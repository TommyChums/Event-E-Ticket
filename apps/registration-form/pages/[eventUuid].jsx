import { useEffect, useMemo, useState } from "react";
import Head from 'next/head'
import { Controller, useForm } from 'react-hook-form';
import { v4, parse } from 'uuid';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import CheckboxGroup from "../components/CheckboxGroup";
import supabase from "../lib/supabase";
import getEventWithImgs from "../lib/getEventWithImgs";

function caseString(value, splitChar = ' ') {
  const nameParts = value.split(splitChar);
  
  const allPartsCased = map(nameParts, (part) => {
    return map(part, (val, i) => {
      if (i === 0) {
        return val.toUpperCase();
      } else {
        return val.toLowerCase();
      }
    }).join('');
  });

  const casedString = allPartsCased.join(splitChar);

  if (splitChar === ' ' && allPartsCased.length === 1) {
    return caseString(casedString, '-');
  }

  return casedString;
};

const registrationNumberFromUuid = (uuid) => Buffer.from(parse(uuid)).readUint32BE(0);

export default function RegistrationForm({ event }) {
  const isSmallScreen = useMediaQuery('(max-width:780px)');

  const [ saving, setSaving ] = useState(false);
  const [ info, setInfo ] = useState(null);

  const registrationDisabled = moment().isSameOrAfter(moment(event.register_by_date));
  
  const defaultValues = useMemo(() => ({
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: null,
  }), []);

  const {
    control,
    formState,
    handleSubmit,
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues,
  });

  const { errors, isDirty, isSubmitting, isSubmitSuccessful, isValid } = formState;

  useEffect(() => {
    if (isSubmitSuccessful && !saving && info?.type !== 'error') {
      reset(defaultValues);
    }
  }, [ info, isSubmitSuccessful, reset, saving, defaultValues ]);

  const submitDisabled = registrationDisabled || saving || !isDirty || isSubmitting || !isValid;

  const onSubmit = async (data) => {
    const age = moment().diff(data.date_of_birth, 'years');

    const userUuid = v4();

    setInfo({ type: 'info', message: `Registering for event...` });
    setSaving(true);

    const { data: newUser, error } = await supabase
      .from('registered-users')
      .insert([{
        ...data,
        uuid: userUuid,
        age,
        registered_event: event.uuid,
        registration_number: registrationNumberFromUuid(userUuid),
      }]).single();

    if (error) {
      setInfo({ type: 'error', message: `Error while registering: ${error.message}` });
    } else {
      setInfo({ type: 'success', message: 'Registration Successful!' });
      setTimeout(() => setInfo(null), 3000);
      // Don't await this, just let it be done in the background
      fetch(`/api/registration-email?user_uuid=${newUser.uuid}`)
        .catch((e) => `[NON-FATAL ERROR] - Sending registration email ${e.message}`);
    }

    setSaving(false);

  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundImage: `radial-gradient(circle, white, ${event.branding?.primary_colour?.hex})` }}>
      <Head>
        <title>{`Register | ${event.name} | ${event.host} presents ${event.name}`}</title>
        <meta property="og:title" content={`${event.name} | ${event.host} presents ${event.name}`} key="title" />
        <link rel="icon" type="image/x-icon" href={event.logo || '/images/rlc-logo.ico'} />
      </Head>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '1rem 1rem 5rem',
        }}
        style={{
          maxWidth: '848px'
        }}
      >
        <Paper elevation={10} style={{ borderRadius: '5px' }}>
          <Stack sx={{ margin: '0' }} direction="column" spacing={2}>
            <Avatar alt="" variant="square" src={event.banner} sx={{ width: '100%', height: '100%', maxWidth: 800 / (isSmallScreen ? 2 : 1), maxHeight: 200 / (isSmallScreen ? 2 : 1), alignSelf: 'center', borderRadius: '4px 4px 0 0' }} />
            <Typography variant="h5" fontWeight="bold">
              {event.name}
            </Typography>
            <Typography variant="h6">
              {event.description || `${event.host} presents ${event.name}`}
            </Typography>
          </Stack>
          {
            registrationDisabled ? (
              <>
                <Typography sx={{ margin: '2rem 0 0', color: 'red' }} variant="body1" fontWeight="bold">
                  We are no longer accpeting any more registrations.
                </Typography>
                <Typography sx={{ margin: '0', color: 'red' }} variant="body1" fontWeight="bold">
                  The registration period for this event has passed.
                </Typography>
              </>
            ) : null
          }
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
            onSubmit={handleSubmit(onSubmit)}
            onReset={reset}
            >
            <Stack px={2} pb={2} direction="column" spacing={4}>
              <Alert sx={{ visibility: info ? 'visible' : 'hidden' }} severity={info?.type}>{info?.message}</Alert>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={registrationDisabled}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    id="outlined-email"
                    label="Email *"
                    variant="outlined"
                    type="email"
                  />
                )}
                rules={{
                  required: 'Required',
                }}
              />
              <Stack sx={{ justifyContent: 'space-between' }} direction="row" spacing={2}>
                <Controller
                  control={control}
                  name="first_name"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onBlur={() => {
                        field.onChange(caseString(field.value.trim()));
                      }}
                      onChange={({ target }) => {
                        const { value } = target;
                        field.onChange(caseString(value));
                      }}
                      disabled={registrationDisabled}
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                      id="outlined-first-name"
                      label="First Name *"
                      variant="outlined"
                      type="text"
                      fullWidth
                    />
                  )}
                  rules={{
                    required: 'Required',
                  }}
                />
                <Controller
                  control={control}
                  name="last_name"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onBlur={() => {
                        field.onChange(caseString(field.value.trim()));
                      }}
                      onChange={({ target }) => {
                        const { value } = target;
                        field.onChange(caseString(value));
                      }}
                      disabled={registrationDisabled}
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                      id="outlined-last-name"
                      label="Last Name *"
                      variant="outlined"
                      type="text"
                      fullWidth
                    />
                  )}
                  rules={{
                    required: 'Required',
                  }}
                />
              </Stack>
              <Controller
                control={control}
                name="phone_number"
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={registrationDisabled}
                    error={!!errors.phone_number}
                    helperText={errors.phone_number?.message}
                    id="outlined-last-name"
                    label="Phone Number"
                    variant="outlined"
                    type="text"
                  />
                )}
                rules={{
                  pattern: {
                    value: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
                    message: '(868) 123-4567'
                  }
                }}
              />
              <Controller
                control={control}
                name="date_of_birth"
                label="Date of Birth *"
                rules={{
                  validate: {
                    required: (val) => val ? null : 'Required',
                    isValidDate: (val) => moment(val, true).isValid() ? null : 'Invalid Date',
                  },
                }}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      {...field}
                      disableFuture
                      inputFormat="YYYY-MM-DD"
                      label="Date of Birth *"
                      disabled={registrationDisabled}
                      InputLabelProps={{ shrink: true }}
                      openTo="year"
                      views={[ 'year', 'month', 'day' ]}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          helperText={errors.date_of_birth?.message || 'yyyy-mm-dd'}
                          error={!!errors.date_of_birth}
                        />
                      )}
                    />
                  </LocalizationProvider>
                )}
              />
              {
                map(event.additional_user_information, (additionalInfoInput) => {
                  const { field_name, field_label, field_type, required, options, options_required } = additionalInfoInput;

                  if (field_type === 'text') {
                    return (
                      <Controller
                        key={field_name}
                        control={control}
                        name={`additional_information.${field_name}`}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            disabled={registrationDisabled}
                            error={!!errors[field_name]}
                            helperText={errors[field_name]?.message}
                            id={`outlined-${field_name}`}
                            label={field_label}
                            variant="outlined"
                            type="text"
                          />
                        )}
                        rules={{
                          required: required ? 'Required' : false,
                        }}
                      />
                    );
                  } else if (field_type === 'checkbox') {
                    return (
                      <Controller
                        key={field_name}
                        control={control}
                        defaultValue={[]}
                        name={`additional_information.${field_name}`}
                        render={({ field }) => (
                          <CheckboxGroup
                            {...field}
                            disabled={registrationDisabled}
                            requiredAmt={options_required}
                            options={options}
                            label={field_label}
                          />
                        )}
                        rules={{
                          validate: {
                            requiredSelected: (val = []) => val.length >= (options_required || 0) ? null : 'Required',
                          },
                        }}
                      />
                    );
                  }
                })
              }
              <Button disabled={submitDisabled} type="submit" variant="contained">
                {saving ? 'Registering' : 'Submit'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export async function getStaticPaths() {
  const { data: events } = await supabase.from('events').select('uuid');

  const paths = (events || []).map((event) => ({
    params: { eventUuid: event.uuid },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export async function getStaticProps({ params }) {
  const { data: event } = await supabase.from('events').select('*').eq('uuid', params.eventUuid).single();

  if (isEmpty(event)) {
    return {
      notFound: true,
    };
  }

  const { data: eventWithImgs } = getEventWithImgs(event, false);

  return {
    props: {
      event: eventWithImgs,
    },
    revalidate: 30,
  };
};
