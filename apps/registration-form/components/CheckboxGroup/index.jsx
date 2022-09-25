import { useEffect, useState } from 'react';
import map from 'lodash/map';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import { Typography } from '@mui/material';

export default function CheckboxGroup({ requiredAmt = 0, options = [], disabled, onChange, label, value }) {
  const [ checkedArray, setCheckedArray ] = useState([]);

  useEffect(() => {
    if (Array.isArray(value)) {
      setCheckedArray(value);
    }
  }, [ value ]);

  const handleChange = ({ target: { checked, name } }) => {
    const tmpArr = [...checkedArray];
    if (checked) {
      tmpArr.push(name);
    } else {
      tmpArr.splice(tmpArr.indexOf(name), 1);
    }

    if (typeof onChange === 'function') {
      onChange(tmpArr);
    } else {
      setCheckedArray(tmpArr);
    }
  };

  const error = checkedArray.length < requiredAmt;

  return (
    <Box sx={{ display: 'flex' }}>
      <FormControl required={!!requiredAmt} component="fieldset" variant="standard">
        <Typography color="GrayText" component="label">{`${label} ${!!requiredAmt ? '*' : ''}`}</Typography>
        <FormGroup>
          {
            map(options, (option) => {
              // if false assumed option is of type { label: '', value: '' }
              const optionString = typeof option === 'string';
              const optionLabel = optionString ? option : option.label;
              const optionValue = optionString ? option : option.value;
              return (
                <FormControlLabel
                  key={optionValue}
                  control={
                    <Checkbox disabled={disabled} checked={checkedArray.indexOf(optionValue) !== -1} onChange={handleChange} name={optionValue} />
                  }
                  label={optionLabel}
                />
              );
            })
          }
        </FormGroup>
        <FormHelperText>{error ? `Please select at least ${requiredAmt} option${requiredAmt !== 1 ? 's' : ''}` : ''}</FormHelperText>
      </FormControl>
    </Box>
  );
};
