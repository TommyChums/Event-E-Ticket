import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Head from 'next/head'
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { v4, parse } from 'uuid';
import moment from 'moment';
import momentTimeZone from 'moment-timezone';
import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import Fuse from 'fuse.js'
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from "@mui/material/Divider";
import useMediaQuery from '@mui/material/useMediaQuery';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import CheckboxGroup from '../components/CheckboxGroup';
import supabase from '../lib/supabase';
import getEventWithImgs from '../lib/getEventWithImgs';
import timeZoneToCountry from '../lib/timeZoneToCountry.json';
import countries from '../lib/countries.json';

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
  const [ infos, setInfos ] = useState([{}]);

  const registrationDisabled = moment().isSameOrAfter(moment(event.register_by_date));

  const registrationFormFields = event.registration_form_fields;

  const {
    email: emailField,
    first_name: firstNameField,
    last_name: lastNameField,
    phone_number: phoneNumberField,
    date_of_birth: dateOfBirthField,
    ...additionalFormFields
  } = registrationFormFields;
  
  const defaultValues = useMemo(() => ({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: null,
    additional_information: reduce(additionalFormFields, (next, { field_name, default_value = null }) => { next[field_name] = default_value; return next; }, {}),
  }), [ additionalFormFields ]);

  const {
    control,
    formState,
    handleSubmit,
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "registrations",
    shouldUnregister: true
  });

  const { errors, isDirty, isSubmitting, isSubmitSuccessful, isValid } = formState;


  const checkIsDuplicate = useCallback(async (userData) => {
      const { data: eventUsers } = await supabase.from('registered-users')
        .select('uuid, email, first_name, last_name')
        .eq('registered_event', event.uuid)

      if (isEmpty(eventUsers)) return [ false, null ]

      const options = {
        includeScore: true,
        ignoreLocation: true,
        threshold: 0.2,
        distance: 10,
        keys: [
          {
            name: 'email',
            weight: 1
          },
          {
            name: 'first_name',
            weight: 2
          },
          {
            name: 'last_name',
            weight: 2
          },
        ],
      }

      const fuse = new Fuse(eventUsers, options)

      const searchString = [
        userData.email,
        userData.first_name,
        userData.last_name,
      ].join(' | ')

      const results = fuse.search({
        $and: [
          { email: userData.email },
          { first_name: userData.first_name },
          { last_name: userData.last_name },
        ]
      })
      // const results = fuse.search(searchString)

      if (!results.length) {
        return [ false, null ]
      }

      console.debug('results:', results)

      return [ true, results[0].item ]
  }, [])

  useEffect(() => {
    append(defaultValues)
    return () => remove(0)
  }, [])

  useEffect(() => {
    if (isSubmitSuccessful && !saving && !(infos.find((info) => info?.type === 'error'))) {
      reset(defaultValues);
      append(defaultValues)
    }
  }, [ infos, isSubmitSuccessful, reset, saving, defaultValues ]);

  const submitDisabled = registrationDisabled || saving || !isDirty || isSubmitting || !isValid;

  const onSubmit = async (data) => {
    const errs = []

    setInfos([{ id:'main', type: 'info', message: `Registering for event...` }]);
    setSaving(true);

    const infoMsgs = []

    for (const registration of data.registrations) {
      const fullName = `${registration.first_name} ${registration.last_name}`

      const age = registration.date_of_birth ? moment().diff(registration.date_of_birth, 'years') : 0
  
      const userUuid = v4();
  
      // registered-user-duplicates

      const userData = {
        ...registration,
        email: data.email,
        uuid: userUuid,
        age,
        registered_event: event.uuid,
        registration_number: registrationNumberFromUuid(userUuid),
      }

      const [ isDuplicateUser, matchedUser ] = await checkIsDuplicate(userData)

      if (isDuplicateUser) {
        const duplicateUser = {
          ...userData,
          duplicate_uuid: matchedUser.uuid
        }

        console.debug('Found duplicate', duplicateUser)
        const { data: newUser, error } = await supabase
          .from('registered-user-duplicates')
          .insert([
            duplicateUser
          ]).select().single();
    
        if (error) {
          errs.push(error)
          infoMsgs.push({ type: 'error', message: `Error while registering ${fullName}: ${error.message}` });
        } else {
          infoMsgs.push({ type: 'success', message: `Registration Successful for ${fullName}!` });
        }
      } else {
        const { data: newUser, error } = await supabase
          .from('registered-users')
          .insert([
            userData
          ]).select().single();
    
        if (error) {
          errs.push(error)
          infoMsgs.push({ type: 'error', message: `Error while registering ${fullName}: ${error.message}` });
        } else {
          infoMsgs.push({ type: 'success', message: `Registration Successful for ${fullName}!` });
          // Don't await this, just let it be done in the background
          fetch(`/api/registration-email?user_uuid=${newUser.uuid}`)
            .catch((e) => `[NON-FATAL ERROR] - Sending registration email ${e.message}`);
        }
      }
    }

    setInfos(infoMsgs);

    if (!errs.length) setTimeout(() => setInfos([{}]), 3000);

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
            <Typography variant="h6" style={{ margin: '5px 15px 0' }}>
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
              {
                infos.map((info) => (
                  <Alert key={info.id} sx={{ visibility: info.message ? 'visible' : 'hidden' }} severity={info?.type}>{info?.message}</Alert>
                ))
              }
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
                    label={'Email' + (emailField.required ? ' *' : '')}
                    variant="outlined"
                    type="email"
                  />
                )}
                rules={{
                  required: emailField.required ? 'Required' : false,
                }}
              />
              {
                fields.map((item, index) => {
                  const isFirst = index === 0
                  const isLast = index === (fields.length - 1)

                  return (
                    <Fragment key={item.id}>
                      <Divider />
                      <Stack pt={2} direction="column" spacing={4}>
                        <Stack sx={{ justifyContent: 'space-between' }} direction="row" spacing={2}>
                          <Controller
                            control={control}
                            name={`registrations.${index}.first_name`}
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
                                label={'First Name' + (firstNameField.required ? ' *' : '')}
                                variant="outlined"
                                type="text"
                                fullWidth
                              />
                            )}
                            rules={{
                              required: firstNameField.required ? 'Required' : false,
                            }}
                          />
                          <Controller
                            control={control}
                            name={`registrations.${index}.last_name`}
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
                                label={'Last Name' + (lastNameField.required ? ' *' : '')}
                                variant="outlined"
                                type="text"
                                fullWidth
                              />
                            )}
                            rules={{
                              required: lastNameField.required ? 'Required' : false,
                            }}
                          />
                        </Stack>
                        {
                          phoneNumberField ? (
                            <Controller
                              control={control}
                              name={`registrations.${index}.phone_number`}
                              defaultValue=""
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  disabled={registrationDisabled}
                                  error={!!errors.phone_number}
                                  helperText={errors.phone_number?.message}
                                  id="outlined-last-name"
                                  label={'Phone Number' + (phoneNumberField.required ? ' *' : '')}
                                  variant="outlined"
                                  type="text"
                                />
                              )}
                              rules={phoneNumberField.required ? {
                                pattern: {
                                  value: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
                                  message: '(868) 123-4567'
                                },
                                required: 'Required'
                              } : {}}
                            />
                          ) : null
                        }
                        {
                          dateOfBirthField ? (
                            <Controller
                              control={control}
                              name={`registrations.${index}.date_of_birth`}
                              label={'Date of Birth' + (dateOfBirthField.required ? ' *' : '')}
                              rules={dateOfBirthField.required ? {
                                validate: {
                                  required: (val) => val ? null : 'Required',
                                  isValidDate: (val) => moment(val, true).isValid() ? null : 'Invalid Date',
                                },
                              } : {}}
                              render={({ field }) => (
                                <LocalizationProvider dateAdapter={AdapterMoment}>
                                  <DatePicker
                                    {...field}
                                    disableFuture
                                    inputFormat="YYYY-MM-DD"
                                    label={'Date of Birth' + (dateOfBirthField.required ? ' *' : '')}
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
                          ) : null
                        }
                        {
                          map(additionalFormFields, (additionalInfoInput) => {
                            const { field_name, field_label: defaultLabel, field_type, required, options, options_required } = additionalInfoInput;

                            let field_label = defaultLabel;

                            if (required && !field_label.includes('*')) field_label += " *";

                            if ([ 'text', 'email' ].includes(field_type)) {
                              return (
                                <Controller
                                  key={field_name}
                                  control={control}
                                  name={`registrations.${index}.additional_information.${field_name}`}
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
                                      type={field_type}
                                    />
                                  )}
                                  rules={{
                                    required: required ? 'Required' : false,
                                  }}
                                />
                              );
                            } else if (field_type === 'date') {
                              return (
                                <Controller
                                  control={control}
                                  name={`registrations.${index}.additional_information.${field_name}`}
                                  label={field_label}
                                  rules={required ? {
                                    required: 'Required',
                                    isValidDate: (val) => moment(val, true).isValid() ? null : 'Invalid Date',
                                  }: {}}
                                  render={({ field }) => (
                                    <LocalizationProvider dateAdapter={AdapterMoment}>
                                      <DatePicker
                                        {...field}
                                        inputFormat="YYYY-MM-DD"
                                        label={field_label}
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
                              );
                            } else if (field_type === 'checkbox') {
                              return (
                                <Controller
                                  key={field_name}
                                  control={control}
                                  defaultValue={[]}
                                  name={`registrations.${index}.additional_information.${field_name}`}
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
                                    required: required ? 'Required' : false,
                                    validate: {
                                      requiredSelected: (val = []) => val.length >= (options_required || 0) ? null : 'Required',
                                    },
                                  }}
                                />
                              );
                            } else if (field_type === 'radio') {
                              return (
                                <Controller
                                  key={field_name}
                                  control={control}
                                  defaultValue={additionalInfoInput?.default_value}
                                  name={`registrations.${index}.additional_information.${field_name}`}
                                  render={({ field }) => (
                                    <Container
                                      style={{
                                        paddingLeft: '2px'
                                      }}
                                      sx={{
                                        justifyContent: 'left',
                                        alignItems: 'left',
                                        textAlign: 'left',
                                        margin: '0'
                                      }}
                                    >
                                      <FormControl>
                                        <FormLabel id={`radio-label-${field_name}`}>{field_label}</FormLabel>
                                        <RadioGroup
                                          {...field}
                                          row
                                        >
                                          {
                                            map(options, (option) => {
                                              // if false assumed option is of type { label: '', value: '' }
                                              const optionString = typeof option === 'string';
                                              const optionLabel = optionString ? option : option.label;
                                              const optionValue = optionString ? option : option.value;

                                              return (
                                                <FormControlLabel value={optionValue} control={<Radio />} label={optionLabel} />
                                              );
                                            })
                                          }
                                        </RadioGroup>
                                      </FormControl>
                                    </Container>
                                  )}
                                  rules={{
                                    required: required ? 'Required' : false,
                                  }}
                                />
                              );
                            } else if (field_type === 'select' && !isEmpty(options)) {
                              return (
                                <Controller
                                  key={field_name}
                                  control={control}
                                  defaultValue={additionalInfoInput?.default_value}
                                  name={`registrations.${index}.additional_information.${field_name}`}
                                  render={({ field }) => (
                                    <FormControl fullWidth>
                                      <InputLabel id={`select-label-${field_name}`}>{field_label}</InputLabel>
                                      <Select
                                        {...field}
                                        labelId={`select-label-${field_name}`}
                                        disabled={registrationDisabled}
                                        label={field_label}
                                      >
                                        {map(options, (option) => (
                                          <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  )}
                                  rules={{
                                    required: required ? 'Required' : false,
                                  }}
                                />
                              );
                            } else if (field_type === 'country') {
                              const userTimeZone = momentTimeZone.tz.guess();

                              const defaultValue = countries.find((opt) => opt === timeZoneToCountry[userTimeZone]) || countries[0];

                              return (
                                <Controller
                                  key={field_name}
                                  control={control}
                                  defaultValue={defaultValue}
                                  name={`registrations.${index}.additional_information.${field_name}`}
                                  render={({ field }) => (
                                    <FormControl fullWidth>
                                      <InputLabel id={`select-label-${field_name}`}>{field_label}</InputLabel>
                                      <Select
                                        {...field}
                                        labelId={`select-label-${field_name}`}
                                        disabled={registrationDisabled}
                                        label={field_label}
                                      >
                                        {map(countries, (option) => (
                                          <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  )}
                                  rules={{
                                    required: required ? 'Required' : false,
                                  }}
                                />
                              );
                            } else if (field_type === 'address') {
                              const userTimeZone = momentTimeZone.tz.guess();

                              const defaultCountryValue = countries.find((opt) => opt === timeZoneToCountry[userTimeZone]) || countries[0];
                              
                              const base_field_name = `additional_information.${field_name}`;
                              return (
                                <Stack key={field_name} spacing={2} textAlign="left">
                                  <InputLabel style={{ paddingLeft: '1px', textAlign: 'center' }} id={`select-label-${field_name}`}>{field_label}</InputLabel>
                                  <Controller
                                    control={control}
                                    name={`${base_field_name}.address_1`}
                                    render={({ field }) => (
                                      <TextField
                                        {...field}
                                        disabled={registrationDisabled}
                                        error={!!errors[`${base_field_name}.address_1`]}
                                        helperText={errors[`${base_field_name}.address_1`]?.message}
                                        id={`outlined-${`${base_field_name}.address_1`}`}
                                        label={"Address 1" + (required ? " *" : "")}
                                        variant="outlined"
                                        type="text"
                                      />
                                    )}
                                    rules={{
                                      required: required ? 'Required' : false,
                                    }}
                                  />
                                  <Controller
                                    control={control}
                                    name={`${base_field_name}.address_2`}
                                    render={({ field }) => (
                                      <TextField
                                        {...field}
                                        disabled={registrationDisabled}
                                        error={!!errors[`${base_field_name}.address_2`]}
                                        helperText={errors[`${base_field_name}.address_2`]?.message}
                                        id={`outlined-${`${base_field_name}.address_2`}`}
                                        label="Address 2"
                                        variant="outlined"
                                        type="text"
                                      />
                                    )}
                                  />
                                  <Stack direction={isSmallScreen ? "column" : "row"} spacing={2}>
                                    <Controller
                                      control={control}
                                      name={`${base_field_name}.city`}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          disabled={registrationDisabled}
                                          error={!!errors[`${base_field_name}.city`]}
                                          helperText={errors[`${base_field_name}.city`]?.message}
                                          id={`outlined-${`${base_field_name}.city`}`}
                                          label={"City" + (required ? " *" : "")}
                                          variant="outlined"
                                          type="text"
                                          fullWidth
                                        />
                                      )}
                                      rules={{
                                        required: required ? 'Required' : false,
                                      }}
                                    />
                                    {!find(additionalFormFields, [ 'field_type', 'country' ]) ? (
                                      <Controller
                                        control={control}
                                        defaultValue={defaultCountryValue}
                                        name={`${base_field_name}.country`}
                                        render={({ field }) => (
                                          <FormControl fullWidth>
                                            <InputLabel id={`select-label-${field_name}`}>{"Country" + (required ? " *" : "")}</InputLabel>
                                            <Select
                                              {...field}
                                              labelId={`select-label-${base_field_name}-country`}
                                              disabled={registrationDisabled}
                                              label={"Country" + (required ? " *" : "")}
                                            >
                                              {map(countries, (option) => (
                                                <MenuItem key={option} value={option}>{option}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        )}
                                        rules={{
                                          required: required ? 'Required' : false,
                                        }}
                                      />
                                    ) : null}
                                  </Stack>
                                </Stack>
                              );
                            }
                          })
                        }
                        {
                          isFirst ? null : (
                            <Button type="button" variant="outlined" color="error" onClick={() => remove(index)}>
                              Remove Registration
                            </Button>
                          )
                        }
                        {
                          isLast ? <Divider /> : null
                        }
                      </Stack>
                    </Fragment>
                  )
                })
              }
              {
                event.event_options.multiple_registrations ? (
                  <Button type="button" variant="contained" color="success" onClick={() => append(defaultValues)}>
                    Add Registration
                  </Button>
                ) : null
              }
              <Divider />
              <Button
                disabled={submitDisabled}
                type="submit"
                variant="contained"
                style={submitDisabled ? {} : {
                  backgroundColor: event.branding?.primary_colour?.hex
                }}
              >
                {saving ? 'Registering' : fields.length > 1 ? 'Submit Registrations' : 'Submit'}
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
