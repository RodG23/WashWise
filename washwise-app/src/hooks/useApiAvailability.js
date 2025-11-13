import { useEffect, useState } from 'react';

export function useApiAvailability() {
  const [state, setState] = useState('UP'); // assume up no arranque

  useEffect(() => {
    let unsubscribe = null;
    window.api.getApiState().then(r => setState(r.state));
    unsubscribe = window.api.onApiStateChange(setState);
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return { state, apiDown: state !== 'UP' };
}
