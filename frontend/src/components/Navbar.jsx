import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Calendar, ChevronDown, UserCircle, LogIn, UserPlus, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const currentLang = i18n.language;

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

            {/* Profile Dropdown */}
            <div 
              className="relative" 
              ref={dropdownRef}
            >
              <button
                onMouseEnter={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDropdownOpen ? 'bg-primary-700 text-white' : 'bg-kine-700 text-white hover:bg-kine-800'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span className="font-medium">
                  {isAuthenticated ? user?.name : (currentLang === 'ar' ? 'الملف الشخصي' : 'Profil')}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  className={`absolute ${currentLang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}
                >
                  {isAuthenticated ? (
                    <>
                      {/* Dashboard */}
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Calendar className="w-5 h-5" />
                        <span>{currentLang === 'ar' ? 'لوحة التحكم' : 'Tableau de bord'}</span>
                      </Link>

                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{currentLang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
                      </button>

                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Language Switcher */}
                      <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center gap-3 px-4 py-2 text-white bg-primary-700 hover:bg-primary-800 transition-colors rounded-md"
                      >
                        <Globe className="w-5 h-5" />
                        <span>{currentLang === 'ar' ? 'FR' : 'عربي'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Login */}
                      <Link
                        to="/login"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogIn className="w-5 h-5" />
                        <span>{currentLang === 'ar' ? 'تسجيل الدخول' : 'Connexion'}</span>
                      </Link>

                      {/* Register */}
                      <Link
                        to="/register"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>{currentLang === 'ar' ? 'إنشاء حساب' : 'S\'inscrire'}</span>
                      </Link>

                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Language Switcher */}
                      <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center gap-3 px-4 py-2 text-white bg-primary-700 hover:bg-primary-800 transition-colors rounded-md"
                      >
                        <Globe className="w-5 h-5" />
                        <span>{currentLang === 'ar' ? 'FR' : 'عربي'}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
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

            {/* Profile Section Mobile */}
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isAuthenticated ? user?.name : (currentLang === 'ar' ? 'الملف الشخصي' : 'Profil')}
              </div>

              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>{currentLang === 'ar' ? 'لوحة التحكم' : 'Tableau de bord'}</span>
                  </Link>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{currentLang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{currentLang === 'ar' ? 'تسجيل الدخول' : 'Connexion'}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>{currentLang === 'ar' ? 'إنشاء حساب' : 'S\'inscrire'}</span>
                  </Link>
                </>
              )}

              {/* Language Switcher Mobile */}
              <div className="border-t border-gray-200 my-2 pt-2">
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-white bg-primary-700 hover:bg-primary-800"
                >
                  <Globe className="w-5 h-5" />
                  <span>{currentLang === 'ar' ? 'FR' : 'عربي'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
