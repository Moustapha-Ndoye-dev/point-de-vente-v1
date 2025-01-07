import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../data/auth';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}
