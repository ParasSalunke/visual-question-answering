// Simple client-side hash router
import { useState, useEffect } from 'react';

export type Route = 'ask' | 'testlab' | 'evaluation' | 'learn' | 'responsible-ai';

export function useRouter(): [Route, (r: Route) => void] {
  const getRoute = (): Route => {
    const hash = window.location.hash.replace('#/', '').replace('#', '') || 'ask';
    const valid: Route[] = ['ask', 'testlab', 'evaluation', 'learn', 'responsible-ai'];
    return valid.includes(hash as Route) ? (hash as Route) : 'ask';
  };

  const [route, setRouteState] = useState<Route>(getRoute);

  useEffect(() => {
    const handler = () => setRouteState(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = `#/${r}`;
    setRouteState(r);
  };

  return [route, navigate];
}
