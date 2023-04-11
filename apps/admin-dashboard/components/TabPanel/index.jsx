import PropTypes from 'prop-types';

export default function TabPanel(props) {
  const { children, value, index, fullWidth, ...other } = props;

  return (
    <div
      aria-labelledby={`simple-tab-${index}`}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      role="tabpanel"
      style={{
        ...other.style || {},
        ...fullWidth ? { width: '100%' } : {},
      }}
      {...other}
    >
      {value === index &&
        children
      }
    </div>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
};
