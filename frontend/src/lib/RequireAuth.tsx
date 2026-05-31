import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './auth';
import { Role } from './types';

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3A7BD5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Send to their natural home if they hit a forbidden route
    const home =
      user.role === 'PATIENT'
        ? '/patient'
        : user.role === 'DOCTOR'
        ? '/doctor'
        : user.role === 'NURSE'
        ? '/nurse'
        : '/admin';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
