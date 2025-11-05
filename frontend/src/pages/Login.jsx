import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = await login(formData);
      toast.success(currentLang === 'ar' ? `مرحبا ${data.user.name} !` : `Bienvenue ${data.user.name} !`);
      
      // Redirect based on role
      switch (data.user.role) {
        case 'patient':
          navigate('/dashboard/patient');
          break;
        case 'kine':
          navigate('/dashboard/kine');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || (currentLang === 'ar' ? 'فشل تسجيل الدخول' : 'Connexion échouée'));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {currentLang === 'ar' ? 'تسجيل الدخول' : 'Connexion'}
          </h2>
          <p className="mt-2 text-gray-600">
            {currentLang === 'ar' ? 'قم بتسجيل الدخول إلى حسابك في كينيفيرس' : 'Connectez-vous à votre compte KinéVerse'}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {currentLang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="input pl-10"
                  placeholder="0612345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {currentLang === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Connexion...'}
              </>
            ) : (
              currentLang === 'ar' ? 'تسجيل الدخول' : 'Se connecter'
            )}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">
              {currentLang === 'ar' ? 'لا تملك حساب؟ ' : 'Pas encore de compte ? '}
            </span>
            <Link to="/register" className="text-kine-600 hover:text-kine-700 font-medium">
              {currentLang === 'ar' ? 'إنشاء حساب' : 'S\'inscrire'}
            </Link>
          </div>
        </form>

        {/* Test credentials hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-900 mb-2">
            🔐 {currentLang === 'ar' ? 'حسابات الاختبار:' : 'Comptes de test :'}
          </p>
          <p className="text-blue-800">
            {currentLang === 'ar' ? 'مريض: 0612345678 / Patient123!' : 'Patient : 0612345678 / Patient123!'}
          </p>
          <p className="text-blue-800">
            {currentLang === 'ar' ? 'معالج: 0698765432 / Kine123!' : 'Kiné : 0698765432 / Kine123!'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
