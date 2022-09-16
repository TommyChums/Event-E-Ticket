import { useEffect, useMemo, useState } from "react";
import Head from 'next/head'
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';

import supabase from "../lib/supabase";

export default function RegistrationForm({ event }) {
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
    register,
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

    setInfo({ type: 'info', message: `Registering for event...` });
    setSaving(true);

    const { error } = await supabase
      .from('registered-users')
      .insert([{
        ...data,
        age,
        registered_event: event.uuid,
      }]);

    if (error) {
      setInfo({ type: 'error', message: `Error while registering: ${error.message}` });
    } else {
      setInfo({ type: 'success', message: 'Registration Successful!' });
      setTimeout(() => setInfo(null), 3000);
    }

    setSaving(false)
  };

  return (
    <>
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
          mergin: '2rem 0',
        }}
      >
        <Stack sx={{ margin: registrationDisabled ? '0' : '0 0 2rem' }} direction="column" spacing={1.5}>
          <Avatar alt="" src={event.logo} sx={{ width: 120, height: 120, alignSelf: 'center' }} />
          <Typography variant="h6" fontWeight="bold">
            {event.host}
          </Typography>
          <Typography variant="subtitle1">
            {event.description || `${event.host} presents ${event.name}`}
          </Typography>
        </Stack>
        {
          registrationDisabled ? (
            <>
              <Typography sx={{ margin: '2rem 0 0', color: 'red' }} variant="body1" fontWeight="bold">
                We are no longer accpeting any more registrations.
              </Typography>
              <Typography sx={{ margin: '0 0 2rem', color: 'red' }} variant="body1" fontWeight="bold">
                The registration period for this event has passed.
              </Typography>
            </>
          ) : null
        }
        <form
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
          onSubmit={handleSubmit(onSubmit)}
          onReset={reset}
          >
          <Stack direction="column" spacing={4}>
            <Alert sx={{ visibility: info ? 'visible' : 'hidden' }} severity={info?.type}>{info?.message}</Alert>
            <TextField
              {...register("email", { validate: { required: (val) => val ? null : 'Required' } })}
              disabled={registrationDisabled}
              error={!!errors.email}
              helperText={errors.email?.message}
              id="outlined-email"
              label="Email *"
              variant="outlined"
              type="email"
            />
            <Stack sx={{ justifyContent: 'space-between' }} direction="row" spacing={2}>
              <TextField
                {...register("first_name", { validate: { required: (val) => val ? null : 'Required' } })}
                disabled={registrationDisabled}
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
                id="outlined-first-name"
                label="First Name *"
                variant="outlined"
                type="text"
              />
              <TextField
                {...register("last_name", { validate: { required: (val) => val ? null : 'Required' } })}
                disabled={registrationDisabled}
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
                id="outlined-last-name"
                label="Last Name *"
                variant="outlined"
                type="text"
              />
            </Stack>
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
            <Button disabled={submitDisabled} type="submit" variant="contained">
              {saving ? 'Registering' : 'Submit'}
            </Button>
          </Stack>
        </form>
      </Container>
    </>
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

  const logoLocation = event.logo;

  if (logoLocation) {
    const { publicURL, error } = supabase.storage.from(logoLocation.bucket).getPublicUrl(logoLocation.key);

    if (error) throw error;

    event.logo = publicURL;
  }

  return {
    props: {
      event,
    },
    revalidate: 30,
  };
};
