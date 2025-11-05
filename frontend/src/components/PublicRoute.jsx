import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    const dashboardRoutes = {
      admin: '/dashboard/admin',
      kine: '/dashboard/kine',
      patient: '/dashboard/patient',
    };
    
    const redirectTo = dashboardRoutes[user.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
