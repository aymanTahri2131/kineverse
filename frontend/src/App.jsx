import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from './store/authStore';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AppointmentForm from './pages/AppointmentForm';
import DashboardPatient from './pages/DashboardPatient';
import DashboardKine from './pages/DashboardKine';
import DashboardAdmin from './pages/DashboardAdmin';
import Services from './pages/Services';
import NotFound from './pages/NotFound';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  const { initialize } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Set document direction based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route 
          path="login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route path="services" element={<Services />} />
        <Route path="book" element={<AppointmentForm />} />

        {/* Protected routes - Patient */}
        <Route
          path="dashboard/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardPatient />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - Kine */}
        <Route
          path="dashboard/kine"
          element={
            <ProtectedRoute allowedRoles={['kine']}>
              <DashboardKine />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - Admin */}
        <Route
          path="dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
