import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Phone, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(currentLang === 'ar' ? 'كلمة المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const data = await register({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      });
      
      toast.success(currentLang === 'ar' ? `تم إنشاء الحساب بنجاح! مرحبا ${data.user.name}` : `Compte créé avec succès ! Bienvenue ${data.user.name}`);
      navigate('/dashboard/patient');
    } catch (error) {
      toast.error(error.response?.data?.message || (currentLang === 'ar' ? 'فشل التسجيل' : 'Inscription échouée'));
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
            {currentLang === 'ar' ? 'إنشاء حساب' : 'Créer un compte'}
          </h2>
          <p className="mt-2 text-gray-600">
            {currentLang === 'ar' ? 'انضم إلى كينيفيرس وإدارة مواعيدك' : 'Rejoignez KinéVerse et gérez vos rendez-vous'}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {currentLang === 'ar' ? 'الاسم الكامل *' : 'Nom complet *'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder={currentLang === 'ar' ? 'أحمد محمد' : 'Jean Dupont'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {currentLang === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}
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
              <p className="mt-1 text-xs text-gray-500">
                {currentLang === 'ar' ? 'سيتم استخدام رقم هاتفك لتسجيل الدخول' : 'Votre numéro de téléphone sera utilisé pour vous connecter'}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {currentLang === 'ar' ? 'كلمة المرور *' : 'Mot de passe *'}
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {currentLang === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirmer le mot de passe *'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                {currentLang === 'ar' ? 'جاري إنشاء الحساب...' : 'Création du compte...'}
              </>
            ) : (
              currentLang === 'ar' ? 'إنشاء حساب' : 'S\'inscrire'
            )}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">
              {currentLang === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Vous avez déjà un compte ? '}
            </span>
            <Link to="/login" className="text-kine-600 hover:text-kine-700 font-medium">
              {currentLang === 'ar' ? 'تسجيل الدخول' : 'Se connecter'}
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
