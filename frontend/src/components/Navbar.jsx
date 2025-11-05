import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'patient':
        return '/dashboard/patient';
      case 'kine':
        return '/dashboard/kine';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt="Centre Imane Logo"
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <a
                href="/#services"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.location.pathname === '/') {
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/#services';
                  }
                }}
                className="text-gray-600 hover:text-primary-800 transition-colors"
              >
                {t('nav.services')}
              </a>
            )}
            <Link
              to="/book"
              className={`${isActive('/book')
                  ? 'text-primary-800 font-semibold border-b-4 border-primary-800 transition-all duration-300'
                  : 'text-gray-600 hover:text-primary-800'
                } transition-colors`}
            >
              {t('nav.book')}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-800 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className={`${isActive('/login')
                      ? 'text-primary-800 font-semibold border-b-4 border-primary-800 transition-all duration-300'
                      : 'text-gray-600 hover:text-primary-800'
                    } transition-colors`}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary bg-primary-700 hover:bg-primary-800"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!isAuthenticated && (
              <a
                href="/#services"
                className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  if (window.location.pathname === '/') {
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/#services';
                  }
                }}
              >
                {t('nav.services')}
              </a>
            )}
            <Link
              to="/book"
              className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.book')}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
                <div className="px-3 py-2 text-sm text-gray-700">
                  {user?.name}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-start px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md bg-primary-800 text-white"
                  onClick={() => setIsOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
