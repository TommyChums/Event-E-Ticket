import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

function ControlledNumberInput({ control, name, defaultValue, required, ...props }) {
  const { field, fieldState: { error } } = useController({
    control,
    name,
    defaultValue,
    rules: required ? {
      required: 'Required',
      pattern: {
        value: /^[0-9]+$/,
        message: 'Whole Number'
      }
    } : {}
  });

  return (
    <TextField
      {...props}
      {...field}
      error={!!error}
      helperText={error?.message}
      onChange={({ target }) => {
        const { value } = target;

        const isNumberVal = isFinite(+value);

        if (isNumberVal) {
          field.onChange(+value);
        } else {
          field.onChange(value);
        }
      }}
    />
  );
};

ControlledNumberInput.propTypes = {
  control: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.any,
  required: PropTypes.any
};

ControlledNumberInput.propTypes = {
  defaultValue: null,
  required: true
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
        general_public: 0
      });
      setAgeMapping({
        general_public: {
          from: 0,
          to: 999
        }
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
      isValid
    },
    setValue
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      ...value || {}
    }
  });

  useEffect(() => {
    setDefaultsFromValue(value);
    setAgeRangesToDelete({});
  }, [ setDefaultsFromValue, value ]);

  const onSubmit = (data) => {
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
    if (!newAgeRange) {
      return;
    }

    const newCasedAgeRange = snakeCase(newAgeRange);

    setPricesByAge({
      [newCasedAgeRange]: 0,
      ...pricesByAge
    });
    setAgeMapping({
      [newCasedAgeRange]: {
        from: 0,
        to: 9999
      },
      ...ageMapping
    });

    setNewAgeRange('');

    if (ageRangesToDelete[newCasedAgeRange]) {
      const temp = { ...ageRangesToDelete };

      delete temp[newCasedAgeRange];

      setAgeRangesToDelete(temp);
    }

    setNewAgeRanges([
      ...newAgeRanges,
      newCasedAgeRange
    ]);
  };

  const handleDeleteAgeRange = (ageLabel) => {
    const newAgeMapping = { ...ageMapping };
    const newPricesByAge = { ...pricesByAge };

    delete newAgeMapping[ageLabel];
    delete newPricesByAge[ageLabel];

    setAgeMapping(newAgeMapping);
    setPricesByAge(newPricesByAge);

    setAgeRangesToDelete({
      ...ageRangesToDelete,
      [ageLabel]: true
    });
  };

  return (
    <Dialog fullWidth onClose={onReset} open={open}>
      <DialogTitle>Define the pricing structure</DialogTitle>
      <Stack mb={4} mx={2} spacing={1}>
        {map(pricesByAge, (price, ageLabel) =>
          <Accordion defaultExpanded={newAgeRanges.includes(ageLabel)} key={ageLabel}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <IconButton onClick={() => handleDeleteAgeRange(ageLabel)} sx={{ mt: '-2px' }}>
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
                      control={control}
                      defaultValue={ageMapping[ageLabel]?.from}
                      fullWidth
                      label="Age From:"
                      name={`age_mapping.${ageLabel}.from`}
                    />
                    <ControlledNumberInput
                      control={control}
                      defaultValue={ageMapping[ageLabel]?.to}
                      fullWidth
                      label="Age To:"
                      name={`age_mapping.${ageLabel}.to`}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ControlledNumberInput
                      control={control}
                      defaultValue={price}
                      fullWidth
                      label="Price:"
                      name={`price_by_age.${ageLabel}`}
                    />
                    <ControlledNumberInput
                      control={control}
                      fullWidth
                      label="Early Bird Price:"
                      name={`early_bird_price_by_age.${ageLabel}`}
                      required={false}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
        <Stack direction="row" spacing={1} style={{ margin: '2.5rem 0 0' }}>
          <Controller
            control={control}
            name="early_bird_date"
            render={({ field }) =>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker
                  {...field}
                  ampm
                  disablePast
                  inputFormat="YYYY-MM-DD hh:mm A"
                  label="Early Bird End Date"
                  openTo="month"
                  placeholder='Leave empty for no Early Bird'
                  renderInput={(params) =>
                    <TextField
                      {...params}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="yyyy-mm-dd hh:mm"
                    />
                  }
                  views={[ 'year', 'month', 'day', 'hours', 'minutes' ]}
                />
              </LocalizationProvider>
            }
            rules={{
              validate: {
                isValidDate: (val) => val ? moment(val, true).isValid() ? null : 'Invalid Date' : null
              }
            }}
          />
          <IconButton
            onClick={() => setValue('early_bird_date', null)}
            style={{ marginBottom: '1.5rem' }}
          >
            <HighlightOffIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Stack direction="row" mx={2} spacing={1}>
        <TextField
          fullWidth
          label="New Age Range"
          onChange={({ target }) => setNewAgeRange(target.value)}
          variant="outlined"
        />
        <IconButton
          onClick={() => handleAddNewAgeRange()}
        >
          <AddIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mx: 2, mr: 8, my: 2 }}>
        <Button
          disabled={disabled || !isValid}
          fullWidth
          onClick={handleSubmit(onSubmit)}
          type="button"
          variant="contained"
        >
          Save
        </Button>
        <Button
          fullWidth
          onClick={onReset}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
      </Stack>
    </Dialog>
  );
};

PricingDialog.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired
};
