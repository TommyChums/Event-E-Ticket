import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import WheelComponent from 'react-wheel-of-prizes';
import useMediaQuery from '@mui/material/useMediaQuery';

function RandomWheel(props) {
  const isSmallScreen = useMediaQuery('(max-width:780px)');
  
  const onFinished = (winner) => {
    props.onFinished(winner);
  };

  return (
    <WheelComponent
      segments={props.segments}
      segColors={map(props.segments, () => `#${Math.floor(Math.random()*16777215).toString(16)}`)}
      winningSegment={props.winningSegment}
      onFinished={onFinished}
      primaryColor='#673ab7'
      contrastColor='white'
      buttonText='Spin'
      isOnlyOnce={false}
      size={isSmallScreen ? 138 : 290}
      upDuration={10}
      downDuration={150}
      // fontFamily='Arial'
    />
  );
};

RandomWheel.propTypes = {};

export default RandomWheel;
