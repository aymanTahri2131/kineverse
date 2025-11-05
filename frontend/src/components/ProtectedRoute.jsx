import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading, verifyAndSetUser } = useAuthStore();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Check if we have tokens in localStorage
      const hasTokens = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
      
      if (hasTokens && !isAuthenticated) {
        // We have tokens but not authenticated in store, verify them
        await verifyAndSetUser();
      }
      
      setIsVerifying(false);
    };

    verifyAuth();
  }, [isAuthenticated, verifyAndSetUser]);

  // Show loading while verifying authentication
  if (isVerifying || isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    toast.error(currentLang === 'ar' ? 'يجب تسجيل الدخول' : 'Veuillez vous connecter');
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    toast.error(currentLang === 'ar' ? 'الوصول محظور' : 'Accès refusé');
    
    // Redirect to appropriate dashboard based on user role
    const dashboardRoutes = {
      admin: '/dashboard/admin',
      kine: '/dashboard/kine',
      patient: '/dashboard/patient',
    };
    
    const redirectTo = dashboardRoutes[user?.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
