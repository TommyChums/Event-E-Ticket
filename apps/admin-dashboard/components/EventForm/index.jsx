import React, { useState } from 'react'
import { Controller, useController, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { usePlacesWidget } from "react-google-autocomplete";

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

export default function EventForm({ event = {} }) {

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    mode: 'onBlur',
    defaultValues: event,
  });

  return (
    <Container maxWidth="md" sx={{ marginBottom: '2rem' }}>
      <form
        onSubmit={handleSubmit(console.log)}
        onReset={() => reset(event, { keepDefaultValues: true })}
      >
        <Stack direction="column" spacing={2}>
          <Typography variant="h6">
            Event Information
          </Typography>
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
            defaultValue={event.venue}
          />
          <Typography variant="h6">
            Ticket Information
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Button fullWidth variant="contained" type="submit">Submit</Button>
            <Button fullWidth variant="outlined" type="reset">Reset</Button>
          </Stack>
        </Stack>
      </form>
    </Container>
  );
};
