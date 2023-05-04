import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import WheelComponent from 'react-wheel-of-prizes';
import useMediaQuery from '@mui/material/useMediaQuery';

function RandomWheel(props) {
  const isSmallScreen = useMediaQuery('(max-width:780px)');
  
  const [ winningSegment, setWinningSegment ] = useState();
  
  const onFinished = (winner) => {
    props.onFinished(winner);
  };

  useEffect(() => {
    if (props.winningSegment) {
      setWinningSegment(props.winningSegment)
    }
  }, [ props.winningSegment ]);

  return (
    <WheelComponent
      segments={props.segments}
      segColors={map(props.segments, () => `#${Math.floor(Math.random()*16777215).toString(16)}`)}
      winningSegment={winningSegment}
      onFinished={onFinished}
      primaryColor='#673ab7'
      contrastColor='white'
      buttonText='Spin'
      isOnlyOnce={false}
      size={isSmallScreen ? 138 : 250}
      upDuration={50}
      downDuration={500}
      // fontFamily='Arial'
    />
  )
};

RandomWheel.propTypes = {};

export default RandomWheel;
