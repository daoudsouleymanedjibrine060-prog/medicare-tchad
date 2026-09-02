import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Role } from '../types';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    const paths: Record<string, string> = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      ASSISTANT: '/assistant/dashboard',
      ADMIN: '/admin/dashboard',
      SUPER_ADMIN: '/super-admin/dashboard',
    };
    return <Navigate to={paths[user.role] || '/'} replace />;
  }
  return <Outlet />;
}
