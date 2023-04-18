import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import startCase from 'lodash/startCase';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { makeAuthenticatedPostRequest } from '../../lib/api/makeAuthenticatedRequest';
import useDispatch from '../../lib/hooks/useDispatch';
import { deleteAdminUser } from '../../lib/state/actions/adminUsers';
import CONSTANTS from '../../lib/state/constants';

function CheckedSelect({ defaultValue, onChange, options, value, ...props }) {
  const [ selectedOptions, setSelectedOptions ] = useState([]);
  const [ selectOptions, setSelectOptions ] = useState([]);

  useEffect(() => {
    setSelectedOptions(defaultValue || []);
  }, [ defaultValue ]);

  useEffect(() => {
    const firstOption = options[0];
    const objectOptions = typeof firstOption === 'object';

    if (objectOptions) {
      setSelectOptions(options);
    } else {
      setSelectOptions(
        map(options, (val) => {
          return {
            label: val,
            value: val,
          };
        })
      );
    }
  }, [ options ]);

  useEffect(() => {
    if (typeof value !== 'undefined') {
      setSelectedOptions(value);
    } else {
      onChange(selectedOptions);
    }
  }, [ value, selectedOptions, onChange ]);

  const changeOptions = (val) => {
    if (typeof value !== 'undefined') {
      onChange(val);
    } else {
      setSelectOptions(val);
    }
  };

  return (
    <Stack spacing={2}>
      <FormControl sx={{ width: 245 }}>
        <InputLabel>{props.label}</InputLabel>
        <Select
          {...props}
          multiple
          onChange={({ target: { value } }) => changeOptions(value)}
          value={selectedOptions}
          renderValue={(selected) => selected.map((val) => find(selectOptions, [ 'value', `${val}` ])?.label).join(', ')}
        >
          {map(selectOptions, (option) => {
            const optionLabel = option.label;
            const optionValue = +option.value;

            return (
              <MenuItem key={optionValue} value={optionValue}>
                <Checkbox checked={selectedOptions.indexOf(optionValue) > -1} />
                <ListItemText primary={optionLabel} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default function AdminUserDialog({ eventsById, open, onClose, user, updatePayment, updateUser, ...props }) {
  const supabase = useSupabaseClient();

  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const [ eventsToAllow, setEventsToAllow ] = useState([]);
  const [ isNew, setIsNew ] = useState(false);
  const [ email, setEmail ] = useState();
  const [ firstName, setFirstName ] = useState();
  const [ lastName, setLastName ] = useState();
  const [ role, setRole ] = useState('');
  const [ allowedEventIds, setAllowedEventIds ] = useState([]);
  const [ updatingUser, setUpdatingUser ] = useState(false);

  const notValid = !email || !firstName || !lastName || !role;

  useEffect(() => {
    if (isEmpty(user)) {
      setIsNew(true);
    } else {
      setEmail(user.email);
      setFirstName(user.user_metadata.first_name);
      setLastName(user.user_metadata.last_name);
      setRole(user.app_metadata.role);
      setAllowedEventIds(user.app_metadata.allowed_events || []);
    }
  }, [ user, onClose ]);

  useEffect(() => {
    if (role === 'admin') {
      setEventsToAllow([{ label: 'All', value: '0' }]);
      setAllowedEventIds([ 0 ]);
    } else {
      setEventsToAllow(map(eventsById, (event, id) => ({ label: event.name, value: id })));
      const userAllowed = user?.app_metadata?.allowed_events || [];
      const tempArr = [ ...userAllowed ];
      if (tempArr.indexOf(0) !== -1) {
        tempArr.splice(tempArr.indexOf(0), 1);
      }
      setAllowedEventIds(tempArr);
    }
  }, [ eventsById, role, user ]);

  const handleRemoveUser = async () => {
    try {
      await confirm({
        title: 'Are you sure you wish to remove this user?',
        description: 'The user will not be notified that this was done. This action is irreversible',
        confirmationText: 'Remove',
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

      enqueueSnackbar(`Deleting ${user.email}`, {
        variant: 'info'
      });

      const { error } = await makeAuthenticatedPostRequest('/api/admin/delete-user', { user_id: user.id });

      if (error) {
        enqueueSnackbar(`Failed to remove ${user.email}: ${error.message}`, {
          variant: 'error'
        });
      } else {
        enqueueSnackbar(`Removed ${user.email}`, {
          variant: 'success'
        });

        dispatch(deleteAdminUser({ id: user.id }));
        onClose();
      }
    } catch (e) {
      console.log('Remove cancelled');
    }
  };

  const handleUpdateUser = async () => {
    setUpdatingUser(true);
    let issuingId = null;

    const updatingWord = isNew ? 'Inviting' : 'Updating';

    enqueueSnackbar(`${updatingWord} ${email}`, {
      variant: 'info',
      persist: true,
      action: (id) => {
        issuingId = id;
      }
    });

    const isAdmin = role === 'admin';

    const userAttributes = {
      email,
      user_metadata: {
        ...user?.user_metadata || {},
        first_name: firstName,
        last_name: lastName,
      },
      app_metadata: {
        ...user?.app_metadata || {},
        allowed_events: allowedEventIds,
        role,
        claims_admin: isAdmin,
      },
    };

    try {
      delete userAttributes.app_metadata.allowed_events_names;
      delete userAttributes.app_metadata.allowed_event_names;
    } catch {}

    const {
      data: {
        user: updatedUser
      },
      error: updateError
    } = await makeAuthenticatedPostRequest(`/api/admin/${isNew ? 'create' : 'update'}-user`, { user_id: user.id, attributes: userAttributes });

    closeSnackbar(issuingId);

    if (updateError) {
      enqueueSnackbar(`Error ${updatingWord.toLowerCase()} ${userAttributes.email}: ${updateError}`, {
        variant: 'error'
      });
    } else {
      enqueueSnackbar(`${userAttributes.email} has been ${updatingWord.toLowerCase().replace('ing', '')}ed!`, {
        variant: 'success'
      });

      if (isAdmin) {
        updatedUser.app_metadata.allowed_events_names = [ 'All' ];
      } else {
        updatedUser.app_metadata.allowed_events_names = map(allowedEventIds, (id) => eventsById[id].name);
      }
      updateUser(updatedUser);

      if (isNew) onClose();
    }

    setUpdatingUser(false);
  };

  return (
    <Dialog {...props} onClose={onClose} open={open}>
      { isNew ? (
          <DialogTitle style={{ padding: '16px 12px 0px' }}>Invite User</DialogTitle>
        ) : (
          <DialogTitle style={{ padding: '16px 12px 0px' }}>{user.user_metadata?.first_name} {user.user_metadata?.last_name}</DialogTitle>
        )
      }
      <DialogContent style={{ padding: '20px 12px' }}>
        <Stack direction="column" spacing={2} width="100%">
          {
            isNew ? (
              <>
                <TextField
                  label="Email"
                  type="email"
                  onChange={({ target }) => {
                    const { value } = target;
                    setEmail(value);
                  }}
                />
                <TextField
                  label="First Name"
                  onChange={({ target }) => {
                    const { value } = target;
                    setFirstName(value);
                  }}
                />
                <TextField
                  label="Last Name"
                  onChange={({ target }) => {
                    const { value } = target;
                    setLastName(value);
                  }}
                />
              </>
            ) : null
          }
          <FormControl fullWidth>
            <InputLabel sx={{ zIndex: 10, backgroundColor: 'white', padding: 0.15 }}>Role</InputLabel>
            <Select
              defaultValue={role}
              onChange={({ target: { value } }) => setRole(value)}
              value={role}
            >
              {
                map(CONSTANTS.ROLES, (role) => (
                  <MenuItem key={role} value={role}>
                    {startCase(role)}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
          <div style={{ width: '100%' }}>
            <CheckedSelect
              defaultValue={allowedEventIds}
              disabled={role === 'admin'}
              label="Allowed Events"
              options={eventsToAllow}
              onChange={setAllowedEventIds}
              value={allowedEventIds}
            />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: '12px' }}>
        <Stack spacing={1} width="100%">
          <Button
            disabled={notValid || updatingUser}
            onClick={handleUpdateUser}
            sx={{ width: '100%' }}
            variant="contained"
          >
            {updatingUser ? (isNew ? 'Inviting User' : 'Updating User') : (isNew ? 'Invite User' : 'Update User')}
          </Button>
          {
            !isNew ? (
              <Button
                color="error"
                disabled={user.app_metadata?.claims_admin || updatingUser}
                onClick={handleRemoveUser}
                sx={{ width: '100%' }}
                variant="contained"
              >
                Remove User
              </Button>
            ) : null
          }
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

AdminUserDialog.propTypes = {
  eventsById: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  updatePayment: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired
};
