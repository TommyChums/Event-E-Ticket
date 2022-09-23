import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useController, useForm } from 'react-hook-form';
import moment from 'moment';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import isFinite from 'lodash/isFinite';
import map from 'lodash/map';
import snakeCase from 'lodash/snakeCase';
import startCase from 'lodash/startCase';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

function ControlledNumberInput({ control, name, defaultValue, required = true, ...props }) {
  const { field, fieldState: { error } } = useController({
    control,
    name,
    defaultValue,
    rules: required ? {
      required: 'Required',
      pattern: {
        value: /^[0-9]+$/,
        message: 'Whole Number',
      },
    } : {},
  });

  return (
    <TextField
      {...props}
      {...field}
      onChange={({ target }) => {
        const { value } = target;

        const isNumberVal = isFinite(+value);

        if (isNumberVal) {
          field.onChange(+value);
        } else {
          field.onChange(value);
        }
      }}
      error={!!error}
      helperText={error?.message}
    />
  );
};

export default function PricingDialog(props) {
  const { disabled, onClose, open, value, onChange } = props;

  const [ newAgeRange, setNewAgeRange ] = useState('');

  const [ newAgeRanges, setNewAgeRanges ] = useState([]);

  const [ pricesByAge, setPricesByAge ] = useState({});
  const [ ageMapping, setAgeMapping ] = useState({});

  const [ ageRangesToDelete, setAgeRangesToDelete ] = useState({});

  const setDefaultsFromValue = useCallback((val) => {
    if (isEmpty(val)) {
      setPricesByAge({
        general_public: 0,
      });
      setAgeMapping({
        general_public: {
          from: 0,
          to: 999,
        },
      });
      setNewAgeRanges([ 'general_public' ]);
    } else {
      setPricesByAge(val.price_by_age);
      setAgeMapping(val.age_mapping);
    }

  }, [ setPricesByAge, setAgeMapping ]);

  const {
    control,
    handleSubmit,
    reset,
    formState: {
      isValid,
    },
    setValue,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      ...value || {},
    },
  });

  useEffect(() => {
   setDefaultsFromValue(value);
   setAgeRangesToDelete({});
  }, [ setDefaultsFromValue, value ]);

  const onSubmit = (data, e) => {
    const newData = { ...data };

    forEach(ageRangesToDelete, (_, ageLabel) => {
      delete newData?.age_mapping[ageLabel];
      delete newData?.price_by_age[ageLabel];
    });

    setAgeRangesToDelete({});
    onChange(data);
    onClose();
  };

  const onReset = () => {
    reset(value || {});
    setDefaultsFromValue(value);
    setAgeRangesToDelete({});
    onClose();
  };

  const handleAddNewAgeRange = () => {
    if (!newAgeRange) return;

    const newCasedAgeRange = snakeCase(newAgeRange);
    
    setPricesByAge({
      [newCasedAgeRange]: 0,
      ...pricesByAge,
    });
    setAgeMapping({
      [newCasedAgeRange]: {
        from: 0,
        to: 9999,
      },
      ...ageMapping,
    });
    
    setNewAgeRange('');

    if (ageRangesToDelete[newCasedAgeRange]) {
      const temp = { ...ageRangesToDelete };

      delete temp[newCasedAgeRange];

      setAgeRangesToDelete(temp);
    }

    setNewAgeRanges([
      ...newAgeRanges,
      newCasedAgeRange,
    ]);
  };

  const handleDeleteAgeRange = (ageLabel) => {
    const newAgeMapping = {...ageMapping};
    const newPricesByAge = {...pricesByAge};

    delete newAgeMapping[ageLabel];
    delete newPricesByAge[ageLabel];

    setAgeMapping(newAgeMapping);
    setPricesByAge(newPricesByAge);

    setAgeRangesToDelete({
      ...ageRangesToDelete,
      [ageLabel]: true,
    });
  };

  return (
    <Dialog onClose={onReset} open={open} fullWidth>
      <DialogTitle>Define the pricing structure</DialogTitle>
      <Stack mx={2} mb={4} spacing={1}>
        {map(pricesByAge, (price, ageLabel) => (
          <Accordion key={ageLabel} defaultExpanded={newAgeRanges.includes(ageLabel)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <IconButton sx={{ mt: '-2px' }} onClick={() => handleDeleteAgeRange(ageLabel)}>
                  <HighlightOffIcon sx={{ fontSize: '18px' }} />
                </IconButton>
                {startCase(ageLabel)}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={1}>
                <Stack direction="column" spacing={2} width="100%">
                  <Stack direction="row" spacing={1} >
                    <ControlledNumberInput
                      fullWidth
                      control={control}
                      name={`age_mapping.${ageLabel}.from`}
                      defaultValue={ageMapping[ageLabel]?.from}
                      label="Age From:"
                    />
                    <ControlledNumberInput
                      fullWidth
                      control={control}
                      name={`age_mapping.${ageLabel}.to`}
                      defaultValue={ageMapping[ageLabel]?.to}
                      label="Age To:"
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ControlledNumberInput
                      fullWidth
                      control={control}
                      name={`price_by_age.${ageLabel}`}
                      defaultValue={price}
                      label="Price:"
                    />
                    <ControlledNumberInput
                      fullWidth
                      control={control}
                      name={`early_bird_price_by_age.${ageLabel}`}
                      label="Early Bird Price:"
                      required={false}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
        <Stack direction="row" spacing={1} style={{ margin: '2.5rem 0 0' }}>
          <Controller
            control={control}
            name="early_bird_date"
            rules={{
              validate: {
                isValidDate: (val) => val ? moment(val, true).isValid() ? null : 'Invalid Date' : null,
              },
            }}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker
                  {...field}
                  ampm
                  disablePast
                  inputFormat="YYYY-MM-DD hh:mm A"
                  placeholder='Leave empty for no Early Bird'
                  label="Early Bird End Date"
                  openTo="month"
                  views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="yyyy-mm-dd hh:mm"
                    />
                  )}
                />
              </LocalizationProvider>
            )}
          />
          <IconButton
            onClick={() => setValue('early_bird_date', null)}
            style={{ marginBottom: '1.5rem' }}
          >
            <HighlightOffIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Stack mx={2} direction="row" spacing={1}>
        <TextField
          label="New Age Range"
          variant="outlined"
          onChange={({ target: { value } }) => setNewAgeRange(value)}
          fullWidth
        />
        <IconButton
          onClick={() => handleAddNewAgeRange()}
        >
          <AddIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" sx={{ mx: 2, mr: 8, my: 2 }} spacing={1}>
        <Button
          disabled={disabled || !isValid}
          variant="contained"
          type="button"
          onClick={handleSubmit(onSubmit)}
          fullWidth
        >
          Save
        </Button>
        <Button
          variant="outlined"
          type="button"
          onClick={onReset}
          fullWidth
        >
          Cancel
        </Button>
      </Stack>
    </Dialog>
  );
}
