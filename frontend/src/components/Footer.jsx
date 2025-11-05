import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  return (
    <footer className="bg-white text-gray-700 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="Centre Imane Logo" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm">
              {currentLang === 'ar' 
                ? 'منصتكم للحجز عبر الإنترنت للعلاج الطبيعي عالي الجودة' 
                : 'Votre plateforme de réservation en ligne pour des soins de kinésithérapie de qualité.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">
              {currentLang === 'ar' ? 'روابط سريعة' : 'Liens Rapides'}
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/#services" 
                  className="hover:text-kine-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.location.pathname === '/') {
                      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/#services';
                    }
                  }}
                >
                  {currentLang === 'ar' ? 'خدماتنا' : 'Nos Services'}
                </a>
              </li>
              <li>
                <Link to="/book" className="hover:text-kine-600 transition-colors">
                  {currentLang === 'ar' ? 'حجز موعد' : 'Prendre RDV'}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-kine-600 transition-colors">
                  {currentLang === 'ar' ? 'تسجيل الدخول' : 'Connexion'}
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-kine-600 transition-colors">
                  {currentLang === 'ar' ? 'التسجيل' : 'S\'inscrire'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">
              {currentLang === 'ar' ? 'اتصل بنا' : 'Contact'}
            </h3>
            <ul className="space-y-2">
              <li className={`flex items-center ${currentLang === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
                <Phone className="w-4 h-4" />
                <span>+212 623924997</span>
              </li>
              <li className={`flex items-center ${currentLang === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
                <Mail className="w-4 h-4" />
                <span>contact@centreimane.com</span>
              </li>
              <li className={`flex items-center ${currentLang === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
                <MapPin className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'شارع الجيش الملكي، العروي، المغرب' : 'Al Arouit, Maroc'}</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">
              {currentLang === 'ar' ? 'تابعونا' : 'Suivez-nous'}
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-kine-100 rounded-full flex items-center justify-center hover:bg-kine-600 hover:text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-kine-100 rounded-full flex items-center justify-center hover:bg-kine-600 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-kine-100 rounded-full flex items-center justify-center hover:bg-kine-600 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} KinéVerse. {currentLang === 'ar' ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}.</p>
        </div>
      </div>
    </footer>
  );
}
