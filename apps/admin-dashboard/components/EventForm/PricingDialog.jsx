import React, { useCallback, useEffect, useState } from 'react'
import { useController, useForm } from 'react-hook-form';
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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

function ControlledNumberInput({ control, name, defaultValue, ...props }) {
  const { field, fieldState: { error } } = useController({
    control,
    name,
    defaultValue,
    //TODO: See why this isn't working
    rules: {
      required: 'Required',
      pattern: {
        value: /^[0-9]+$/,
        message: 'Whole Number',
      },
    },
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
  const { onClose, open, value, onChange } = props;

  const [ newAgeRange, setNewAgeRange ] = useState('');

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
          <Stack key={ageLabel} spacing={1}>
            <Typography
              sx={{ mt: 0.5, ml: 0 }}
              color="text.secondary"
              display="block"
              variant="caption"
            >
              {startCase(ageLabel)}
            </Typography>
            <Stack direction="row" spacing={1}>
              <ControlledNumberInput
                control={control}
                name={`age_mapping.${ageLabel}.from`}
                defaultValue={ageMapping[ageLabel]?.from}
                label="Age From:"
              />
              <ControlledNumberInput
                control={control}
                name={`age_mapping.${ageLabel}.to`}
                defaultValue={ageMapping[ageLabel]?.to}
                label="Age To:"
              />
              <ControlledNumberInput
                control={control}
                name={`price_by_age.${ageLabel}`}
                defaultValue={price}
                label="Price:"
              />
              <IconButton onClick={() => handleDeleteAgeRange(ageLabel)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Stack>
        ))}
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
          disabled={!isValid}
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
