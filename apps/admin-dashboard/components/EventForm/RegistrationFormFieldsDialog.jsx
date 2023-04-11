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
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import defaultEvent from './defaultEvent';

function ControlledChips({ control, name, defaultValue, required, ...props }) {
  const [ newChipValue, setNewChipValue ] = useState('');
  const [ chipValues, setChipValues ] = useState(defaultValue || []);

  const { field, fieldState: { error } } = useController({
    control,
    name,
    defaultValue,
    rules: required ? {
      validate: {
        atLeastTwo: (val) => isEmpty(val) || val.length < 2 ? 'At least 2 options required' : null
      }
    } : {}
  });

  useEffect(() => {
    field.onChange(chipValues);
    field.onBlur();
  }, [ chipValues, field.onChange, field.onBlur ]);

  const handleAddNewChipValue = () => {
    if (!newChipValue || chipValues.includes(newChipValue.trim())) return;

    setChipValues([
      ...chipValues,
      newChipValue.trim(),
    ]);

    setNewChipValue('');
  };

  const handleDelete = (value) => {
    setChipValues(chipValues.filter((val) => val !== value));
  };

  return (
    <>
      {error && <p style={{ color: 'red' }}>{error?.message}</p>}
      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          {
            chipValues?.length ? map(chipValues, (value) => (
              <Chip key={value} label={value} onDelete={() => handleDelete(value)}/>
            )) : (
              <Chip label="Empty" />
            )
          }
        </Stack>
        <Stack direction="row" mx={2} spacing={1}>
          <TextField
            fullWidth
            label={props.label}
            onChange={({ target }) => setNewChipValue(target.value)}
            onBlur={field.onBlur}
            value={newChipValue}
            variant="outlined"
          />
          <IconButton
            onClick={() => handleAddNewChipValue()}
          >
            <AddIcon />
          </IconButton>
        </Stack>
      </Stack>
    </>
  );
};

ControlledChips.propTypes = {
  label: PropTypes.string.isRequired,
  control: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.number,
  required: PropTypes.bool
};

ControlledChips.defaultProps = {
  defaultValue: undefined,
  required: true
};

function ControlledTextInput({ control, name, defaultValue, required, ...props }) {
  const { field, fieldState: { error } } = useController({
    control,
    name,
    defaultValue,
    rules: required ? {
      required: 'Required',
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
        field.onChange(value);
      }}
    />
  );
};

ControlledTextInput.propTypes = {
  label: PropTypes.string.isRequired,
  control: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.number,
  required: PropTypes.bool
};

ControlledTextInput.defaultProps = {
  defaultValue: undefined,
  required: true
};

function ControlledSelect({ control, name, defaultValue, required, options, ...props }) {
  const { field, fieldState: { error } } = useController({
    control,
    name,
    defaultValue,
    rules: required ? {
      required: 'Required',
    } : {}
  });

  return (
    <FormControl fullWidth>
      <InputLabel>{props.label}</InputLabel>
      <Select
        {...props}
        {...field}
        error={!!error}
        helperText={error?.message}
      >
        {map(options, (option) => {
          const optionString = typeof option === 'string';
          const optionLabel = optionString ? option : option.label;
          const optionValue = optionString ? option : option.value;

          return (
            <MenuItem key={option} value={optionValue}>{optionLabel}</MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

ControlledSelect.propTypes = {
  label: PropTypes.string.isRequired,
  control: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  defaultValue: PropTypes.number,
  required: PropTypes.bool
};

ControlledSelect.defaultProps = {
  defaultValue: undefined,
  required: false
};

export default function RegistrationFormFieldsDialog(props) {
  const { disabled, onClose, open, value, onChange } = props;

  const [ newFormField, setNewFormField ] = useState('');

  const [ newFormFields, setNewFormFields ] = useState([]);

  const [ formFields, setFormFields ] = useState({});

  const [ formFieldsToDelete, setFormFieldsToDelete ] = useState({});

  const setDefaultsFromValue = useCallback((val) => {
    if (isEmpty(val)) {
      setFormFields(defaultEvent.registration_form_fields);
      setNewFormFields(Object.keys(defaultEvent.registration_form_fields));
    } else {
      setFormFields(val);
    }
  }, [ setFormFields ]);

  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors,
      isValid
    },
    setValue,
    watch,
    trigger,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      ...value || {}
    }
  });

  useEffect(() => {
    console.log('Errors:', errors)
  }, [ errors ]);

  useEffect(() => {
    setDefaultsFromValue(value);
    setFormFieldsToDelete({});
  }, [ setDefaultsFromValue, value ]);

  const onSubmit = (data) => {
    const newData = { ...data };

    forEach(formFieldsToDelete, (_, ageLabel) => {
      delete newData?.age_mapping[ageLabel];
      delete newData?.price_by_age[ageLabel];
    });

    setFormFieldsToDelete({});
    onChange(data);
    onClose();
  };

  const onReset = () => {
    reset(value || {});
    setDefaultsFromValue(value);
    setFormFieldsToDelete({});
    onClose();
  };

  const handleAddNewFormField = () => {
    if (!newFormField) {
      return;
    }

    const newCasedFormField = snakeCase(newFormField);

    setFormFields({
      [newCasedFormField]: {
        field_name: newCasedFormField,
        field_label: newFormField,
        field_type: 'text',
        order: Object.values(formFields).length + 1,
        required: false,
        can_delete: true
      },
      ...formFields
    });

    setNewFormField('');

    if (formFieldsToDelete[newCasedFormField]) {
      const temp = { ...formFieldsToDelete };

      delete temp[newCasedFormField];

      setFormFieldsToDelete(temp);
    }

    setNewFormFields([
      ...newFormFields,
      newCasedFormField
    ]);
  };

  const handleDeleteFormField = (fieldName) => {
    const newFormFields = { ...formFields };

    delete newFormFields[fieldName];

    setFormFields(newFormFields);

    setFormFieldsToDelete({
      ...formFieldsToDelete,
      [fieldName]: true
    });
  };

  return (
    <Dialog fullWidth onClose={onReset} open={open}>
      <DialogTitle>Configure the information you want to capture</DialogTitle>
      <Stack mb={4} mx={2} spacing={1}>
        {map(Object.values(formFields).sort((a, b) => a.order - b.order), (fieldConfig) => {
          const fieldName = fieldConfig.field_name;
          return (
            <Accordion defaultExpanded={newFormFields.includes(fieldName)} key={fieldName}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack alignItems="center" direction="row" spacing={1}>
                  {
                    fieldConfig.can_delete ? (
                      <IconButton onClick={() => handleDeleteFormField(fieldName)} sx={{ mt: '-2px' }}>
                        <HighlightOffIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    ) : null
                  }
                  {fieldConfig.field_label}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1}>
                  <Stack direction="column" spacing={2} width="100%">
                    <Stack direction="row" spacing={1} >
                      <ControlledTextInput
                        control={control}
                        defaultValue={fieldConfig.field_name}
                        name={`${fieldName}.field_name`}
                        style={{ display: 'none' }}
                      />
                      <ControlledTextInput
                        control={control}
                        defaultValue={fieldConfig.field_label}
                        name={`${fieldName}.field_label`}
                        style={{ display: 'none' }}
                      />
                      <ControlledTextInput
                        control={control}
                        defaultValue={fieldConfig.order}
                        name={`${fieldName}.order`}
                        style={{ display: 'none' }}
                      />
                      <ControlledTextInput
                        control={control}
                        defaultValue={!!fieldConfig.can_delete}
                        name={`${fieldName}.order`}
                        style={{ display: 'none' }}
                      />
                      <ControlledSelect
                        control={control}
                        defaultValue={fieldConfig.field_type}
                        disabled={!fieldConfig.can_delete}
                        fullWidth
                        label="Field Type:"
                        name={`${fieldName}.field_type`}
                        options={[
                          {
                            label: 'Text',
                            value: 'text',
                          },
                          {
                            label: 'Address',
                            value: 'address',
                          },
                          {
                            label: 'Checkbox',
                            value: 'checkbox',
                          },
                          {
                            label: 'Country Dropdown',
                            value: 'country',
                          },
                          {
                            label: 'Date',
                            value: 'date',
                          },
                          {
                            label: 'Email',
                            value: 'email',
                          },
                          {
                            label: 'Phone Number',
                            value: 'phone_number',
                          },
                          {
                            label: 'Radio',
                            value: 'radio',
                          },
                          {
                            label: 'Select',
                            value: 'select',
                          },
                        ]}
                      />
                      <ControlledSelect
                        control={control}
                        defaultValue={fieldConfig.required}
                        fullWidth
                        label="Field Required"
                        name={`${fieldName}.required`}
                        options={[
                          {
                            label: 'Required',
                            value: true, 
                          },
                          {
                            label: 'Not Required',
                            value: false, 
                          },
                        ]}
                      />
                    </Stack>
                    {
                      [ 'checkbox', 'radio', 'select' ].includes(watch(`${fieldName}.field_type`)) ? (
                        <ControlledChips
                          control={control}
                          defaultValue={fieldConfig.options}
                          label="Enter new option"
                          name={`${fieldName}.options`}
                        />
                      ) : null
                    }
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Stack>
      <Stack direction="row" mx={2} spacing={1}>
        <TextField
          fullWidth
          label="New Field Label"
          onChange={({ target }) => setNewFormField(target.value)}
          value={newFormField}
          variant="outlined"
        />
        <IconButton
          onClick={() => handleAddNewFormField()}
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

RegistrationFormFieldsDialog.propTypes = {
  disabled: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired
};

RegistrationFormFieldsDialog.defaultProps = {
  disabled: false
};
