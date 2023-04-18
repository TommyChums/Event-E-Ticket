import { useEffect, useState } from 'react';
import useCan from '../../lib/hooks/useCan';

const Can = ({ I, A, children}) => {
  const { can } = useCan();

  const [ allowed, setAllowed ] = useState();

  useEffect(() => {
    setAllowed(can(I, A));
  }, [ can, I, A ]);

  return allowed ? children : null;
};

export default Can;
