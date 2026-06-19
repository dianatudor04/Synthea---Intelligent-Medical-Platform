import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from '../../lib/auth';
import { consentApi } from '../../lib/services';
import { setTrackingEnabled, trackEvent } from '../../lib/events';

/**
 * Pathless root layout. Renders the whole app via <Outlet/> and wires
 * client-side activity tracking:
 *  - enables/disables collection based on the user's analytics consent
 *  - emits a route_change event on every navigation
 * Lives inside the router so useLocation is available app-wide.
 */
export function TelemetryRoot() {
  const { user } = useAuth();
  const location = useLocation();

  // Gate collection on auth + analytics consent. Re-checks whenever the
  // logged-in user changes (login/logout).
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setTrackingEnabled(false);
      return;
    }
    consentApi
      .get()
      .then((c) => {
        if (!cancelled) setTrackingEnabled(!!c.analytics);
      })
      .catch(() => {
        if (!cancelled) setTrackingEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Emit a navigation event. No-op unless tracking is enabled.
  useEffect(() => {
    trackEvent('route_change', { path: location.pathname });
  }, [location.pathname]);

  return <Outlet />;
}
